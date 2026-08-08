const admin = require('firebase-admin');
const { decryptToken } = require('./lib/tokenEncryption');
const { publishToPlatform } = require('./lib/platformAdapters');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const firestore = admin.firestore();

exports.handler = async () => {
  try {
    const nowIso = new Date().toISOString();
    const snapshot = await firestore.collection('scheduledPosts').where('status', '==', 'pending').where('scheduledTime', '<=', nowIso).get();
    if (snapshot.empty) return { statusCode: 200, body: JSON.stringify({ ran: true, processed: 0, results: [] }) };

    const results = [];
    for (const document of snapshot.docs) {
      const postId = document.id;
      const post = document.data();
      await document.ref.update({ status: 'processing', updatedAt: new Date().toISOString() });
      const accountsSnapshot = await firestore.collection('accounts').where('userId', '==', post.userId).get();
      const accounts = {};
      accountsSnapshot.forEach((accountDoc) => { const account = accountDoc.data(); accounts[account.platform] = account; });

      const platformResults = [];
      for (const [platform, content] of Object.entries(post.platforms || {})) {
        try {
          const account = accounts[platform];
          if (!account) throw new Error(`Platform '${platform}' is not connected`);
          const published = await publishToPlatform(platform, { accountId: account.accountId, accessToken: decryptToken(account.accessToken), content, mediaUrl: post.imageUrl || null });
          platformResults.push({ platform, success: true, accountName: account.accountName, postId: published.postId });
        } catch (error) {
          platformResults.push({ platform, success: false, error: error.message });
        }
      }

      const successes = platformResults.filter((result) => result.success).length;
      const status = successes === platformResults.length ? 'published' : successes ? 'partial' : 'failed';
      await document.ref.update({ status, publishResults: platformResults, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      if (post.contentId) await firestore.collection('content').doc(post.contentId).update({ status: status === 'published' ? 'published' : 'draft', updatedAt: new Date().toISOString() });
      results.push({ postId, status, platforms: platformResults });
    }
    return { statusCode: 200, body: JSON.stringify({ ran: true, processed: results.length, results }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
