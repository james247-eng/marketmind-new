const admin = require('firebase-admin');
const axios = require('axios');
const { decryptToken } = require('./lib/tokenEncryption');
const COLLECTIONS = require('./lib/schema.cjs');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const CORS = { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Content-Type': 'application/json' };

async function fetchProvider(platform, account, token) {
  if (platform === 'facebook') return (await axios.get(`https://graph.facebook.com/v18.0/${account.externalAccountId}/insights`, { params: { metric: 'page_impressions,page_engaged_users,page_post_engagements,page_fans', period: 'day', access_token: token } })).data.data;
  if (platform === 'instagram') return (await axios.get(`https://graph.facebook.com/v18.0/${account.externalAccountId}/insights`, { params: { metric: 'impressions,reach,profile_views,follower_count', period: 'day', access_token: token } })).data.data;
  if (platform === 'twitter') return (await axios.get('https://api.twitter.com/2/users/me?user.fields=public_metrics', { headers: { Authorization: `Bearer ${token}` } })).data.data;
  if (platform === 'tiktok') return (await axios.get('https://open.tiktokapis.com/v2/research/user/info/', { headers: { Authorization: `Bearer ${token}` } })).data.data;
  if (platform === 'youtube') return (await axios.get('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', { headers: { Authorization: `Bearer ${token}` } })).data.items?.[0]?.statistics || {};
  throw new Error(`Unsupported platform: ${platform}`);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  try {
    const header = event.headers?.authorization || event.headers?.Authorization || '';
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!idToken) throw new Error('Missing Firebase ID token');
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { platform, accountId, workspaceId } = JSON.parse(event.body || '{}');
    if (!workspaceId) throw new Error('workspaceId is required');
    const workspace = await db.collection(COLLECTIONS.workspaces).doc(workspaceId).get();
    if (!workspace.exists || workspace.data().ownerId !== decoded.uid) throw new Error('Workspace access denied');
    const snap = await db.collection(COLLECTIONS.socialConnections(workspaceId)).where('platform', '==', platform).where('externalAccountId', '==', accountId).where('status', '==', 'connected').limit(1).get();
    if (snap.empty) throw new Error('Connected account not found');
    const account = snap.docs[0].data();
    const data = await fetchProvider(platform, account, decryptToken(account.encryptedAccessTokenRef));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, data }) };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
