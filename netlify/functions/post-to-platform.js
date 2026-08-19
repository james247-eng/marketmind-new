const admin = require('./lib/firebaseAdmin');
const { decryptToken } = require('./lib/tokenEncryption');
const { publishToPlatform } = require('./lib/platformAdapters');
const COLLECTIONS = require('./lib/schema.cjs');

const db = admin.firestore();
const CORS = { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Content-Type': 'application/json' };

function containsRawToken(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => ['accessToken', 'refreshToken', 'access_token', 'refresh_token'].includes(key) || containsRawToken(child));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const payload = JSON.parse(event.body || '{}');
    if (containsRawToken(payload)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'Raw social tokens are not accepted' }) };

    const header = event.headers?.authorization || event.headers?.Authorization || '';
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!idToken) throw new Error('Missing Firebase ID token');
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { platform, accountId, workspaceId } = payload;
    if (!platform || !accountId || !workspaceId) throw new Error('platform, accountId and workspaceId are required');

    const workspace = await db.collection(COLLECTIONS.workspaces).doc(workspaceId).get();
    if (!workspace.exists || workspace.data().ownerId !== decoded.uid) throw new Error('Workspace access denied');
    const snapshot = await db.collection(COLLECTIONS.socialConnections(workspaceId)).where('platform', '==', platform).where('externalAccountId', '==', accountId).where('status', '==', 'connected').limit(1).get();
    if (snapshot.empty) throw new Error('Connected account not found');
    const account = snapshot.docs[0].data();
    const result = await publishToPlatform(platform, { ...payload, accountId: account.externalAccountId, accessToken: decryptToken(account.encryptedAccessTokenRef) });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, postId: result.postId }) };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
