const admin = require('firebase-admin');
const axios = require('axios');
const { decryptToken } = require('./lib/tokenEncryption');

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();
const CORS = { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Content-Type': 'application/json' };

async function publish(platform, account, payload) {
  const accessToken = decryptToken(account.accessToken);
  const content = payload.content || '';
  if (platform === 'facebook') return axios.post(`https://graph.facebook.com/v18.0/${account.accountId}/feed`, { message: content }, { params: { access_token: accessToken } });
  if (platform === 'instagram') {
    if (!payload.mediaUrl) throw new Error('Instagram requires mediaUrl');
    const c = await axios.post(`https://graph.facebook.com/v18.0/${account.accountId}/media`, { image_url: payload.mediaUrl, caption: content }, { params: { access_token: accessToken } });
    return axios.post(`https://graph.facebook.com/v18.0/${account.accountId}/media_publish`, { creation_id: c.data.id }, { params: { access_token: accessToken } });
  }
  if (platform === 'twitter') return axios.post('https://api.twitter.com/2/tweets', { text: content }, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (platform === 'tiktok') return axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', { post_info: { title: content.slice(0, 150), privacy_level: 'PUBLIC_TO_EVERYONE' }, source_info: { source: 'PULL_FROM_URL', video_url: payload.mediaUrl } }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
  if (platform === 'youtube') return axios.post('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', { snippet: { title: payload.title || content.slice(0, 100), description: payload.description || content, categoryId: '22' }, status: { privacyStatus: 'public' } }, { headers: { Authorization: `Bearer ${accessToken}` } });
  throw new Error(`Unsupported platform: ${platform}`);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  try {
    const header = event.headers?.authorization || event.headers?.Authorization || '';
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!idToken) throw new Error('Missing Firebase ID token');
    const decoded = await admin.auth().verifyIdToken(idToken);
    const payload = JSON.parse(event.body || '{}');
    const { platform, accountId } = payload;
    if (!platform || !accountId) throw new Error('platform and accountId are required');
    const snap = await db.collection('accounts').where('userId', '==', decoded.uid).where('platform', '==', platform).where('accountId', '==', accountId).limit(1).get();
    if (snap.empty) throw new Error('Connected account not found');
    const result = await publish(platform, snap.docs[0].data(), payload);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, postId: result.data?.id || result.data?.data?.id || result.data?.data?.publish_id || result.data?.post_id || null }) };
  } catch (error) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
