// netlify/functions/oauth-exchange.js
// Handles OAuth authorization code exchange for all social platforms.
// Secrets live in Netlify environment variables — never in the frontend.

const axios = require('axios');

// ─── Platform configs ─────────────────────────────────────────────────────────
// Each entry maps a platform id to its token endpoint.
// `meta` is removed — it was a duplicate of `instagram` and is not used by
// any connect* function in socialMediaService.js.

const PLATFORM_CONFIGS = {
  youtube: {
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  },
  facebook: {
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  instagram: {
    // Instagram Graph API uses the Facebook OAuth token endpoint
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  tiktok: {
    // v2 endpoint — v1 used in the original was deprecated
    tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token/',
  },
  twitter: {
    tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
  },
  linkedin: {
    tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  },
  pinterest: {
    // v5 endpoint — v1 used in the original was deprecated
    tokenEndpoint: 'https://api.pinterest.com/v5/oauth/token',
  },
  snapchat: {
    tokenEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/token',
  },
};

// ─── Env var helpers ──────────────────────────────────────────────────────────

const getClientSecret = (platform) => {
  // instagram shares Facebook's credentials
  const key    = platform === 'instagram' ? 'facebook' : platform;
  const envVar = `${key.toUpperCase()}_CLIENT_SECRET`;
  const value  = process.env[envVar];
  if (!value) throw new Error(`Missing environment variable: ${envVar}`);
  return value;
};

const getClientId = (platform) => {
  const key    = platform === 'instagram' ? 'facebook' : platform;
  const envVar = `${key.toUpperCase()}_CLIENT_ID`;
  const value  = process.env[envVar];
  if (!value) throw new Error(`Missing environment variable: ${envVar}`);
  return value;
};

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type':                 'application/json',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { platform, code, redirectUri, userId } = JSON.parse(event.body);

    if (!platform || !code || !redirectUri || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: platform, code, redirectUri, userId',
        }),
      };
    }

    if (!PLATFORM_CONFIGS[platform]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unsupported platform: ${platform}` }),
      };
    }

    const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success:      true,
        platform,
        accountId:    tokenResponse.accountId,
        accountName:  tokenResponse.accountName,
        email:        tokenResponse.email        || '',
        accessToken:  tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken || null,
        expiresIn:    tokenResponse.expiresIn,
        scope:        tokenResponse.scope        || '',
      }),
    };
  } catch (error) {
    console.error('OAuth exchange error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to exchange authorization code',
      }),
    };
  }
};

// ─── Router ───────────────────────────────────────────────────────────────────

async function exchangeCodeForToken(platform, code, redirectUri) {
  const clientId     = getClientId(platform);
  const clientSecret = getClientSecret(platform);
  const config       = PLATFORM_CONFIGS[platform];

  switch (platform) {
    case 'youtube':
      return exchangeYouTubeToken(clientId, clientSecret, code, redirectUri, config);
    case 'facebook':
    case 'instagram':
      return exchangeFacebookToken(clientId, clientSecret, code, redirectUri, config);
    case 'tiktok':
      return exchangeTikTokToken(clientId, clientSecret, code, redirectUri, config);
    case 'twitter':
      return exchangeTwitterToken(clientId, clientSecret, code, redirectUri, config);
    case 'linkedin':
      return exchangeLinkedInToken(clientId, clientSecret, code, redirectUri, config);
    case 'pinterest':
      return exchangePinterestToken(clientId, clientSecret, code, redirectUri, config);
    case 'snapchat':
      return exchangeSnapchatToken(clientId, clientSecret, code, redirectUri, config);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// ─── YouTube ──────────────────────────────────────────────────────────────────
// Uses Google's OAuth token endpoint + YouTube Data API for channel info.

async function exchangeYouTubeToken(clientId, clientSecret, code, redirectUri, config) {
  const tokenRes = await axios.post(config.tokenEndpoint, {
    code,
    client_id:     clientId,
    client_secret: clientSecret,
    redirect_uri:  redirectUri,
    grant_type:    'authorization_code',
  });

  const { access_token, refresh_token, expires_in, scope } = tokenRes.data;

  // Fetch the user's YouTube channel to get a real account name
  let accountId   = 'youtube-user';
  let accountName = 'YouTube Account';
  let email       = '';

  try {
    const channelRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const channel = channelRes.data.items?.[0];
    if (channel) {
      accountId   = channel.id;
      accountName = channel.snippet.title;
    }

    // Also fetch the Google account email
    const userRes = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    email = userRes.data.email || '';
  } catch (err) {
    console.warn('Could not fetch YouTube user info:', err.message);
  }

  return {
    accountId,
    accountName,
    email,
    accessToken:  access_token,
    refreshToken: refresh_token,
    expiresIn:    expires_in,
    scope:        scope || '',
  };
}

// ─── Facebook / Instagram ─────────────────────────────────────────────────────
// Both use the Facebook Graph API. Instagram Business accounts are linked
// to a Facebook Page, so they share the same token endpoint and credentials.

async function exchangeFacebookToken(clientId, clientSecret, code, redirectUri, config) {
  const tokenRes = await axios.get(config.tokenEndpoint, {
    params: {
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      code,
    },
  });

  const { access_token, token_type, expires_in } = tokenRes.data;

  // Fetch the Facebook user's name and ID
  let accountId   = 'fb-user';
  let accountName = 'Facebook Account';
  let email       = '';

  try {
    const meRes = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields:       'id,name,email',
        access_token: access_token,
      },
    });
    accountId   = meRes.data.id   || accountId;
    accountName = meRes.data.name || accountName;
    email       = meRes.data.email || '';
  } catch (err) {
    console.warn('Could not fetch Facebook user info:', err.message);
  }

  return {
    accountId,
    accountName,
    email,
    accessToken:  access_token,
    refreshToken: null,          // Facebook uses long-lived tokens, not refresh tokens
    expiresIn:    expires_in || null,
    scope:        'pages_manage_posts,pages_read_engagement',
  };
}

// ─── TikTok ───────────────────────────────────────────────────────────────────
// Uses the v2 API. The v1 endpoint in the original was deprecated.
// TikTok returns user info in the token response itself (open_id, scope).

async function exchangeTikTokToken(clientId, clientSecret, code, redirectUri, config) {
  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({
      client_key:    clientId,
      client_secret: clientSecret,
      code,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in, open_id, scope } = tokenRes.data;

  // Fetch display name from the user info endpoint
  let accountName = open_id;
  try {
    const userRes = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    accountName = userRes.data.data?.user?.display_name || open_id;
  } catch (err) {
    console.warn('Could not fetch TikTok user info:', err.message);
  }

  return {
    accountId:    open_id,
    accountName,
    email:        '',
    accessToken:  access_token,
    refreshToken: refresh_token,
    expiresIn:    expires_in,
    scope:        scope || 'user.info.basic,video.list,video.publish',
  };
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────
// Uses HTTP Basic auth (clientId:clientSecret) as required by Twitter OAuth 2.0.
// The code_verifier must match what was sent in the original auth request.

async function exchangeTwitterToken(clientId, clientSecret, code, redirectUri, config) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({
      code,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
      code_verifier: 'challenge', // Must match code_challenge in connectTwitter()
    }),
    {
      headers: {
        Authorization:  `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;

  let accountId   = 'twitter-user';
  let accountName = 'Twitter Account';

  try {
    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.data.id       || accountId;
    accountName = userRes.data.data.username || userRes.data.data.name || accountName;
  } catch (err) {
    console.warn('Could not fetch Twitter user info:', err.message);
  }

  return {
    accountId,
    accountName,
    email:        '',
    accessToken:  access_token,
    refreshToken: refresh_token,
    expiresIn:    expires_in,
    scope:        'tweet.write tweet.read users.read',
  };
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

async function exchangeLinkedInToken(clientId, clientSecret, code, redirectUri, config) {
  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;

  let accountId   = 'linkedin-user';
  let accountName = 'LinkedIn Account';

  try {
    const userRes = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.id || accountId;
    accountName = `${userRes.data.localizedFirstName} ${userRes.data.localizedLastName}`.trim()
                  || accountName;
  } catch (err) {
    console.warn('Could not fetch LinkedIn user info:', err.message);
  }

  return {
    accountId,
    accountName,
    email:        '',
    accessToken:  access_token,
    refreshToken: refresh_token,
    expiresIn:    expires_in,
    scope:        'r_basicprofile w_member_social',
  };
}

// ─── Pinterest ────────────────────────────────────────────────────────────────
// Updated to v5 API. v1 used in the original was deprecated.

async function exchangePinterestToken(clientId, clientSecret, code, redirectUri, config) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({
      code,
      grant_type:   'authorization_code',
      redirect_uri: redirectUri,
    }),
    {
      headers: {
        Authorization:  `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;

  let accountId   = 'pinterest-user';
  let accountName = 'Pinterest Account';

  try {
    const userRes = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.profile_image || accountId; // Pinterest v5 uses username as identifier
    accountName = userRes.data.username       || accountName;
  } catch (err) {
    console.warn('Could not fetch Pinterest user info:', err.message);
  }

  return {
    accountId,
    accountName,
    email:        '',
    accessToken:  access_token,
    refreshToken: refresh_token,
    expiresIn:    expires_in,
    scope:        'boards:read,pins:read,pins:create',
  };
}

// ─── Snapchat ─────────────────────────────────────────────────────────────────

async function exchangeSnapchatToken(clientId, clientSecret, code, redirectUri, config) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({
      code,
      grant_type:   'authorization_code',
      redirect_uri: redirectUri,
    }),
    {
      headers: {
        Authorization:  `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;

  let accountId   = 'snapchat-user';
  let accountName = 'Snapchat Account';

  try {
    const userRes = await axios.get('https://kit.snapchat.com/v1/me?query={me{displayName,bitmoji{selfie}}}', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.data?.me?.externalId  || accountId;
    accountName = userRes.data.data?.me?.displayName || accountName;
  } catch (err) {
    console.warn('Could not fetch Snapchat user info:', err.message);
  }

  return {
    accountId,
    accountName,
    email:        '',
    accessToken:  access_token,
    refreshToken: refresh_token,
    expiresIn:    expires_in,
    scope:        'snapchat-marketing-api',
  };
}