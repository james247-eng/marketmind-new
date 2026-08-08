const axios = require('axios');

async function facebook({ accountId, accessToken, content = '', mediaUrl }) {
  if (!accountId || !accessToken) throw new Error('Facebook account and credentials are required');
  const endpoint = `https://graph.facebook.com/v18.0/${accountId}/${mediaUrl ? 'photos' : 'feed'}`;
  const body = mediaUrl ? { caption: content, url: mediaUrl } : { message: content };
  const response = await axios.post(endpoint, body, { params: { access_token: accessToken } });
  return { postId: response.data.id || response.data.post_id || null, response: response.data };
}

async function instagram({ accountId, accessToken, content = '', mediaUrl }) {
  if (!accountId || !accessToken || !mediaUrl) throw new Error('Instagram account, credentials, and mediaUrl are required');
  const container = await axios.post(`https://graph.facebook.com/v18.0/${accountId}/media`, { image_url: mediaUrl, caption: content }, { params: { access_token: accessToken } });
  const response = await axios.post(`https://graph.facebook.com/v18.0/${accountId}/media_publish`, { creation_id: container.data.id }, { params: { access_token: accessToken } });
  return { postId: response.data.id || null, response: response.data };
}

async function twitter({ accessToken, content = '' }) {
  if (!accessToken) throw new Error('Twitter credentials are required');
  const response = await axios.post('https://api.twitter.com/2/tweets', { text: content }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
  return { postId: response.data?.data?.id || null, response: response.data };
}

async function tiktok({ accessToken, content = '', mediaUrl }) {
  if (!accessToken || !mediaUrl) throw new Error('TikTok credentials and mediaUrl are required');
  const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    post_info: { title: content.slice(0, 150), privacy_level: 'PUBLIC_TO_EVERYONE', disable_duet: false, disable_comment: false, disable_stitch: false },
    source_info: { source: 'PULL_FROM_URL', video_url: mediaUrl },
  }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' } });
  if (response.data?.error?.code && response.data.error.code !== 'ok') throw new Error(response.data.error.message || 'TikTok publishing failed');
  return { postId: response.data?.data?.publish_id || null, response: response.data };
}

async function linkedin({ accountId, accessToken, content = '', mediaUrl }) {
  if (!accountId || !accessToken) throw new Error('LinkedIn account and credentials are required');
  const response = await axios.post('https://api.linkedin.com/v2/ugcShares', {
    author: `urn:li:person:${accountId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: content }, shareMediaCategory: mediaUrl ? 'ARTICLE' : 'NONE', media: mediaUrl ? [{ status: 'READY', originalUrl: mediaUrl }] : [] } },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' } });
  return { postId: response.data?.id || response.headers?.['x-restli-id'] || null, response: response.data };
}

async function youtube({ accessToken, content = '', title, description }) {
  if (!accessToken) throw new Error('YouTube credentials are required');
  const response = await axios.post('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', {
    snippet: { title: title || content.slice(0, 100), description: description || content, categoryId: '22' },
    status: { privacyStatus: 'public' },
  }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
  return { postId: response.data?.id || null, response: response.data };
}

const adapters = { facebook, instagram, twitter, tiktok, linkedin, youtube };

async function publishToPlatform(platform, payload) {
  const adapter = adapters[platform];
  if (!adapter) throw new Error(`Unsupported platform: ${platform}`);
  return adapter(payload);
}

module.exports = { publishToPlatform, supportedPlatforms: Object.keys(adapters) };
