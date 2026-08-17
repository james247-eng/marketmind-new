const admin = require('firebase-admin');
const { decryptToken } = require('./lib/tokenEncryption');
const { publishToPlatform } = require('./lib/platformAdapters');
const COLLECTIONS = require('./lib/schema.cjs');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const firestore = admin.firestore();
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MINUTES = 5;

const updateContentStatus = async (workspaceId, contentItemId, status) => {
  if (!contentItemId) return;
  await firestore.collection(COLLECTIONS.contentItems(workspaceId)).doc(contentItemId).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

exports.handler = async () => {
  try {
    const dueJobs = await firestore
      .collectionGroup('publishingJobs')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', admin.firestore.Timestamp.now())
      .get();

    if (dueJobs.empty) {
      return { statusCode: 200, body: JSON.stringify({ ran: true, processed: 0, results: [] }) };
    }

    const results = [];
    for (const document of dueJobs.docs) {
      const workspaceId = document.ref.parent.parent.id;
      const claimed = await firestore.runTransaction(async (transaction) => {
        const fresh = await transaction.get(document.ref);
        if (!fresh.exists || fresh.data().status !== 'scheduled') return null;
        const attempts = (fresh.data().attempts || 0) + 1;
        transaction.update(document.ref, {
          status: 'processing',
          attempts,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { ...fresh.data(), attempts };
      });

      if (!claimed) continue;

      try {
        const accountSnapshot = await firestore
          .collection(COLLECTIONS.socialConnections(workspaceId))
          .where('platform', '==', claimed.platform)
          .where('status', '==', 'connected')
          .limit(1)
          .get();
        if (accountSnapshot.empty) throw new Error(`Platform '${claimed.platform}' is not connected`);

        const account = accountSnapshot.docs[0].data();
        const published = await publishToPlatform(claimed.platform, {
          accountId: account.externalAccountId,
          accessToken: decryptToken(account.encryptedAccessTokenRef),
          content: claimed.content,
          mediaUrl: claimed.mediaUrl || null,
        });

        await document.ref.update({
          status: 'published',
          platformPostId: published.postId || null,
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastError: admin.firestore.FieldValue.delete(),
        });
        await updateContentStatus(workspaceId, claimed.contentItemId, 'published');
        results.push({ jobId: document.id, status: 'published', platform: claimed.platform });
      } catch (publishError) {
        const exhausted = claimed.attempts >= MAX_ATTEMPTS;
        const updates = {
          status: exhausted ? 'failed' : 'scheduled',
          lastError: publishError.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (!exhausted) {
          updates.scheduledAt = admin.firestore.Timestamp.fromMillis(Date.now() + RETRY_DELAY_MINUTES * 60 * 1000);
        }
        await document.ref.update(updates);
        if (exhausted) await updateContentStatus(workspaceId, claimed.contentItemId, 'failed');
        results.push({ jobId: document.id, status: exhausted ? 'failed' : 'retrying', attempts: claimed.attempts, error: publishError.message });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ran: true, processed: results.length, results }) };
  } catch (error) {
    console.error('execute-scheduled-posts failed:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
