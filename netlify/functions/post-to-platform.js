// netlify/functions/post-to-platform.js
// Handles posting content to all social media platforms uniformly.
// All outbound API calls live safely here on the server side to protect secrets.

const axios = require('axios');

const CORS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

// ─── Platform Distribution Handlers ──────────────────────────────────────────

async function postToFacebook({ pageId, accessToken, content, mediaUrl }) {
  if (!pageId) throw new Error('pageId target field parameter is required for Facebook Pages API distribution pathing');
  if (!accessToken) throw new Error('Valid permanent Page accessToken is required');

  const endpointUrl = mediaUrl 
    ? `https://graph.facebook.com/v18.0/${pageId}/photos` 
    : `https://graph.facebook.com/v18.0/${pageId}/feed`;

  const payload = mediaUrl 
    ? { message: content, url: mediaUrl } 
    : { message: content };

  const res = await axios.post(endpointUrl, payload, {
    params: { access_token: accessToken }
  });

  return {
    success: true,
    postId: res.data.id || res.data.post_id,
  };
}

async function postToInstagram({ accountId, accessToken, content, mediaUrl }) {
  if (!accountId) throw new Error('Instagram unique accountId identifier string is required');
  if (!mediaUrl) throw new Error('Instagram Business API endpoints strictly require a public media asset URL link resource container');
  if (!accessToken) throw new Error('Active Graph API connection accessToken is required');

  // Step 1: Initialize container configuration pipeline block creation
  const containerRes = await axios.post(`https://graph.facebook.com/v18.0/${accountId}/media`, {
    image_url: mediaUrl,
    caption: content,
  }, {
    params: { access_token: accessToken }
  });

  const creationId = containerRes.data.id;
  if (!creationId) throw new Error('Failed to accurately retrieve Instagram operational media creation ID container context reference');

  // Step 2: Formally issue the container publish command hook parameters
  const publishRes = await axios.post(`https://graph.facebook.com/v18.0/${accountId}/media_publish`, {
    creation_id: creationId,
  }, {
    params: { access_token: accessToken }
  });

  return {
    success: true,
    postId: publishRes.data.id,
  };
}

async function postToTwitter({ accessToken, content }) {
  if (!accessToken) throw new Error('Authorized user scoped bearer token is required to dispatch tweet properties');

  const res = await axios.post('https://api.twitter.com/2/tweets', {
    text: content
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.data?.data?.id) throw new Error('Twitter/X API pipeline execution node did not correctly return a post-publish Tweet identifier');

  return {
    success: true,
    postId: res.data.data.id,
  };
}

async function postToTikTok({ accessToken, content, mediaUrl }) {
  if (!accessToken) throw new Error('TikTok endpoint access authorization header token is missing');
  if (!mediaUrl) throw new Error('TikTok video distribution target channels requires a media source target string location pointer');

  const res = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    post_info: {
      title: content.slice(0, 150),
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000,
    },
    source_info: {
      source: 'PULL_FROM_URL',
      video_url: mediaUrl,
    },
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });

  if (res.data?.error?.code && res.data.error.code !== 'ok') {
    throw new Error(res.data.error.message || 'TikTok publishing initialization rejected');
  }

  return {
    success: true,
    postId: res.data.data?.publish_id,
  };
}

async function postToYouTube({ accessToken, content, mediaUrl, title, description }) {
  if (!accessToken) throw new Error('Google OAuth credentials required to initialize streaming metadata inserts');
  if (!mediaUrl) throw new Error('YouTube payload schema requires a video storage media target location pointer');

  const res = await axios.post('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', {
    snippet: {
      title: title || content.slice(0, 100),
      description: description || content,
      categoryId: '22',
    },
    status: {
      privacyStatus: 'public',
    },
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.data?.id) throw new Error('YouTube core pipeline did not accurately establish a valid structural content shell video resource id');

  return {
    success: true,
    postId: res.data.id,
  };
}

// ─── Platform Distribution Router Matrix ─────────────────────────────────────

const PLATFORM_ROUTER = {
  facebook:  postToFacebook,
  instagram: postToInstagram,
  twitter:   postToTwitter,
  tiktok:    postToTikTok,
  youtube:   postToYouTube,
};

// ─── Main Orchestrator Lambda Handler ────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: 'Target operational dispatch endpoint method option not supported' }),
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const { platform } = payload;

    if (!platform) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Missing mandatory tracking parameter property flag field: platform' }),
      };
    }

    const platformHandler = PLATFORM_ROUTER[platform];
    if (!platformHandler) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: `Selected social channel context execution path driver not mapped: ${platform}` }),
      };
    }

    // Execute target micro-handler pipeline mapping block logic loop safely
    const executionOutcome = await platformHandler(payload);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, ...executionOutcome }),
    };

  } catch (error) {
    console.error('[post-to-platform] Pipeline crash processing action:', error.response?.data || error.message);
    
    // Deconstruct safe unified nested downstream tracking objects elegantly
    const errorBodyPayload = error.response?.data?.error?.message 
      || error.response?.data?.error 
      || error.message;

    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ success: false, error: errorBodyPayload }),
    };
  }
};