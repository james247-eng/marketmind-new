const admin = require('firebase-admin');
const { decryptToken } = require('./lib/tokenEncryption');
const { publishToPlatform } = require('./lib/platformAdapters');

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.applicationDefault() });
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
    const { platform, accountId } = payload;
    if (!platform || !accountId) throw new Error('platform and accountId are required');

    const snapshot = await db.collection('accounts').where('userId', '==', decoded.uid).where('platform', '==', platform).where('accountId', '==', accountId).limit(1).get();
    if (snapshot.empty) throw new Error('Connected account not found');
    const account = snapshot.docs[0].data();
    const result = await publishToPlatform(platform, { ...payload, accountId: account.accountId, accessToken: decryptToken(account.accessToken) });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, postId: result.postId }) };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
