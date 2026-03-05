// netlify/functions/post-to-platform.js
// Handles posting content to all social media platforms.
// All outbound API calls live here — never in the browser — to avoid CORS
// blocks and to keep access tokens off the client.
//
// Request body:
// {
//   platform:    'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube',
//   accessToken: string,
//   content:     string,        // text content
//   mediaUrl:    string | null, // Cloudinary URL if media attached
//   // platform-specific extras:
//   pageId:      string,        // facebook
//   accountId:   string,        // instagram
//   title:       string,        // youtube
//   description: string,        // youtube
// }

const https = require('https');

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

// ─── Generic HTTPS helper ─────────────────────────────────────────────────────

const request = (options, body = null) => new Promise((resolve, reject) => {
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
      catch { resolve({ status: res.statusCode, body: data }); }
    });
  });
  req.on('error', reject);
  if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
  req.end();
});

// ─── Platform handlers ────────────────────────────────────────────────────────

// FACEBOOK
// Posts text (+ optional image) to a Facebook Page.
async function postToFacebook({ pageId, accessToken, content, mediaUrl }) {
  if (!pageId)      throw new Error('pageId is required for Facebook posting');
  if (!accessToken) throw new Error('accessToken is required');

  const body = {
    message:      content,
    access_token: accessToken,
  };

  // If image URL provided, use /photos endpoint instead of /feed
  const endpoint = mediaUrl
    ? `/${pageId}/photos`
    : `/${pageId}/feed`;

  if (mediaUrl) body.url = mediaUrl;

  const postBody = new URLSearchParams(body).toString();

  const res = await request({
    hostname: 'graph.facebook.com',
    path:     `/v18.0${endpoint}`,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postBody),
    },
  }, postBody);

  if (res.body.error) throw new Error(res.body.error.message);

  return {
    success: true,
    postId:  res.body.id || res.body.post_id,
  };
}

// INSTAGRAM
// Two-step: create media container → publish it.
// Requires a Cloudinary (or any public) image URL.
async function postToInstagram({ accountId, accessToken, content, mediaUrl }) {
  if (!accountId)   throw new Error('accountId is required for Instagram posting');
  if (!mediaUrl)    throw new Error('Instagram requires an image URL');
  if (!accessToken) throw new Error('accessToken is required');

  // Step 1: Create media container
  const containerBody = new URLSearchParams({
    image_url:    mediaUrl,
    caption:      content,
    access_token: accessToken,
  }).toString();

  const containerRes = await request({
    hostname: 'graph.facebook.com',
    path:     `/v18.0/${accountId}/media`,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(containerBody),
    },
  }, containerBody);

  if (containerRes.body.error) throw new Error(containerRes.body.error.message);
  const creationId = containerRes.body.id;

  // Step 2: Publish the container
  const publishBody = new URLSearchParams({
    creation_id:  creationId,
    access_token: accessToken,
  }).toString();

  const publishRes = await request({
    hostname: 'graph.facebook.com',
    path:     `/v18.0/${accountId}/media_publish`,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(publishBody),
    },
  }, publishBody);

  if (publishRes.body.error) throw new Error(publishRes.body.error.message);

  return {
    success: true,
    postId:  publishRes.body.id,
  };
}

// TWITTER / X
// Posts a tweet. Media upload via URL is not directly supported by Twitter v2 —
// the accessToken must be a user OAuth2 token with tweet.write scope.
async function postToTwitter({ accessToken, content }) {
  if (!accessToken) throw new Error('accessToken is required');

  const tweetBody = JSON.stringify({ text: content });

  const res = await request({
    hostname: 'api.twitter.com',
    path:     '/2/tweets',
    method:   'POST',
    headers:  {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(tweetBody),
    },
  }, tweetBody);

  if (res.body.errors?.length) throw new Error(res.body.errors[0].message);
  if (!res.body.data?.id)      throw new Error('Twitter did not return a tweet ID');

  return {
    success: true,
    postId:  res.body.data.id,
  };
}

// TIKTOK
// Initialises a video upload using TikTok v2 API.
// Requires a valid Cloudinary video URL.
async function postToTikTok({ accessToken, content, mediaUrl }) {
  if (!accessToken) throw new Error('accessToken is required');
  if (!mediaUrl)    throw new Error('TikTok requires a video URL');

  const body = JSON.stringify({
    post_info: {
      title:                    content.slice(0, 150), // TikTok title limit
      privacy_level:            'PUBLIC_TO_EVERYONE',
      disable_duet:             false,
      disable_comment:          false,
      disable_stitch:           false,
      video_cover_timestamp_ms: 1000,
    },
    source_info: {
      source:    'PULL_FROM_URL',
      video_url: mediaUrl,
    },
  });

  const res = await request({
    hostname: 'open.tiktokapis.com',
    path:     '/v2/post/publish/video/init/',
    method:   'POST',
    headers:  {
      'Authorization':  `Bearer ${accessToken}`,
      'Content-Type':   'application/json; charset=UTF-8',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  if (res.body.error?.code && res.body.error.code !== 'ok') {
    throw new Error(res.body.error.message || 'TikTok API error');
  }

  return {
    success:   true,
    postId:    res.body.data?.publish_id,
  };
}

// YOUTUBE
// Inserts a video using the YouTube Data API v3.
// NOTE: This sends metadata only. Actual video bytes must be uploaded separately
// via resumable upload — this creates the video shell with a Cloudinary source URL.
async function postToYouTube({ accessToken, content, mediaUrl, title, description }) {
  if (!accessToken) throw new Error('accessToken is required');
  if (!mediaUrl)    throw new Error('YouTube requires a video URL');

  const body = JSON.stringify({
    snippet: {
      title:       title       || content.slice(0, 100),
      description: description || content,
      categoryId:  '22', // People & Blogs
    },
    status: {
      privacyStatus: 'public',
    },
  });

  const res = await request({
    hostname: 'www.googleapis.com',
    path:     '/youtube/v3/videos?part=snippet,status',
    method:   'POST',
    headers:  {
      'Authorization':  `Bearer ${accessToken}`,
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  if (res.body.error) throw new Error(res.body.error.message);
  if (!res.body.id)   throw new Error('YouTube did not return a video ID');

  return {
    success: true,
    postId:  res.body.id,
  };
}

// ─── Platform router ──────────────────────────────────────────────────────────

const PLATFORM_HANDLERS = {
  facebook:  postToFacebook,
  instagram: postToInstagram,
  twitter:   postToTwitter,
  tiktok:    postToTikTok,
  youtube:   postToYouTube,
};

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const { platform } = payload;

    if (!platform) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Missing required field: platform' }),
      };
    }

    const handler = PLATFORM_HANDLERS[platform];
    if (!handler) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: `Unsupported platform: ${platform}` }),
      };
    }

    const result = await handler(payload);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, ...result }),
    };

  } catch (error) {
    console.error('post-to-platform error:', error.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};