// netlify/functions/oauthExchange.js
// Handles OAuth authorization code exchange for all social platforms.

const axios = require('axios');

const PLATFORM_CONFIGS = {
  youtube:   { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
  facebook:  { tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token' },
  instagram: { tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token' },
  tiktok:    { tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token/' },
  twitter:   { tokenEndpoint: 'https://api.twitter.com/2/oauth2/token' },
  linkedin:  { tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken' },
  pinterest: { tokenEndpoint: 'https://api.pinterest.com/v5/oauth/token' },
  snapchat:  { tokenEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/token' },
};

const getClientSecret = (platform) => {
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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { platform, code, redirectUri, userId } = JSON.parse(event.body);

    if (!platform || !code || !redirectUri || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: platform, code, redirectUri, userId' }),
      };
    }

    if (!PLATFORM_CONFIGS[platform]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unsupported platform: ${platform}` }),
      };
    }

    const result = await exchangeCodeForToken(platform, code, redirectUri);

    // Facebook returns MULTIPLE accounts (one per Page)
    // All other platforms return a single account
    if (platform === 'facebook' || platform === 'instagram') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success:  true,
          platform,
          multiple: true,       // tells socialMediaService to save each separately
          accounts: result,     // array of { accountId, accountName, accessToken, ... }
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success:      true,
        platform,
        multiple:     false,
        accountId:    result.accountId,
        accountName:  result.accountName,
        email:        result.email        || '',
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken || null,
        expiresIn:    result.expiresIn,
        scope:        result.scope        || '',
      }),
    };

  } catch (error) {
    console.error('OAuth exchange error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to exchange authorization code' }),
    };
  }
};

async function exchangeCodeForToken(platform, code, redirectUri) {
  const clientId     = getClientId(platform);
  const clientSecret = getClientSecret(platform);
  const config       = PLATFORM_CONFIGS[platform];

  switch (platform) {
    case 'youtube':   return exchangeYouTubeToken(clientId, clientSecret, code, redirectUri, config);
    case 'facebook':
    case 'instagram': return exchangeFacebookToken(clientId, clientSecret, code, redirectUri, config);
    case 'tiktok':    return exchangeTikTokToken(clientId, clientSecret, code, redirectUri, config);
    case 'twitter':   return exchangeTwitterToken(clientId, clientSecret, code, redirectUri, config);
    case 'linkedin':  return exchangeLinkedInToken(clientId, clientSecret, code, redirectUri, config);
    case 'pinterest': return exchangePinterestToken(clientId, clientSecret, code, redirectUri, config);
    case 'snapchat':  return exchangeSnapchatToken(clientId, clientSecret, code, redirectUri, config);
    default: throw new Error(`Unsupported platform: ${platform}`);
  }
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

async function exchangeYouTubeToken(clientId, clientSecret, code, redirectUri, config) {
  const tokenRes = await axios.post(config.tokenEndpoint, {
    code, client_id: clientId, client_secret: clientSecret,
    redirect_uri: redirectUri, grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in, scope } = tokenRes.data;
  let accountId = 'youtube-user', accountName = 'YouTube Account', email = '';

  try {
    const channelRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const channel = channelRes.data.items?.[0];
    if (channel) { accountId = channel.id; accountName = channel.snippet.title; }
    const userRes = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    email = userRes.data.email || '';
  } catch (err) { console.warn('Could not fetch YouTube user info:', err.message); }

  return { accountId, accountName, email, accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in, scope: scope || '' };
}

// ─── Facebook / Instagram ─────────────────────────────────────────────────────
// Returns an ARRAY of Pages — each Page gets its own access token.
// This is what allows the user to select which Page to post to.

async function exchangeFacebookToken(clientId, clientSecret, code, redirectUri, config) {
  // Step 1: Exchange code for short-lived user token
  const tokenRes = await axios.get(config.tokenEndpoint, {
    params: { client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code },
  });

  const userAccessToken = tokenRes.data.access_token;

  // Step 2: Exchange for long-lived user token
  let longLivedToken = userAccessToken;
  try {
    const llRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type:        'fb_exchange_token',
        client_id:         clientId,
        client_secret:     clientSecret,
        fb_exchange_token: userAccessToken,
      },
    });
    longLivedToken = llRes.data.access_token || userAccessToken;
  } catch (err) {
    console.warn('Could not exchange for long-lived token:', err.message);
  }

  // Step 3: Fetch all Pages this user manages — each has its own Page access token
  // Page tokens are permanent (don't expire) when derived from a long-lived user token
  const pages = [];
  try {
    const pagesRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: longLivedToken,
        fields:       'id,name,access_token,category,picture',
      },
    });

    for (const page of (pagesRes.data.data || [])) {
      pages.push({
        accountId:    page.id,
        accountName:  page.name,
        email:        '',
        accessToken:  page.access_token,  // ← Page-specific token, not user token
        refreshToken: null,
        expiresIn:    null,               // Page tokens don't expire
        scope:        'pages_manage_posts,pages_read_engagement',
        pageCategory: page.category || '',
      });
    }
  } catch (err) {
    console.warn('Could not fetch Facebook Pages:', err.message);
  }

  // Fallback: if no Pages found, save the user profile so connection doesn't fail silently
  if (pages.length === 0) {
    try {
      const meRes = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: { fields: 'id,name,email', access_token: longLivedToken },
      });
      pages.push({
        accountId:    meRes.data.id   || 'fb-user',
        accountName:  meRes.data.name || 'Facebook Account',
        email:        meRes.data.email || '',
        accessToken:  longLivedToken,
        refreshToken: null,
        expiresIn:    null,
        scope:        'pages_manage_posts,pages_read_engagement',
        pageCategory: 'Personal Profile',
      });
    } catch (err) {
      console.warn('Could not fetch Facebook user info:', err.message);
    }
  }

  return pages; // array
}

// ─── TikTok ───────────────────────────────────────────────────────────────────

async function exchangeTikTokToken(clientId, clientSecret, code, redirectUri, config) {
  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({ client_key: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in, open_id, scope } = tokenRes.data;
  let accountName = open_id;

  try {
    const userRes = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    accountName = userRes.data.data?.user?.display_name || open_id;
  } catch (err) { console.warn('Could not fetch TikTok user info:', err.message); }

  return { accountId: open_id, accountName, email: '', accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in, scope: scope || '' };
}

// ─── Twitter ──────────────────────────────────────────────────────────────────

async function exchangeTwitterToken(clientId, clientSecret, code, redirectUri, config) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: redirectUri, code_verifier: 'challenge' }),
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;
  let accountId = 'twitter-user', accountName = 'Twitter Account';

  try {
    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.data.id       || accountId;
    accountName = userRes.data.data.username || userRes.data.data.name || accountName;
  } catch (err) { console.warn('Could not fetch Twitter user info:', err.message); }

  return { accountId, accountName, email: '', accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in, scope: 'tweet.write tweet.read users.read' };
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

async function exchangeLinkedInToken(clientId, clientSecret, code, redirectUri, config) {
  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;
  let accountId = 'linkedin-user', accountName = 'LinkedIn Account';

  try {
    const userRes = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.id || accountId;
    accountName = `${userRes.data.localizedFirstName} ${userRes.data.localizedLastName}`.trim() || accountName;
  } catch (err) { console.warn('Could not fetch LinkedIn user info:', err.message); }

  return { accountId, accountName, email: '', accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in, scope: 'r_basicprofile w_member_social' };
}

// ─── Pinterest ────────────────────────────────────────────────────────────────

async function exchangePinterestToken(clientId, clientSecret, code, redirectUri, config) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;
  let accountId = 'pinterest-user', accountName = 'Pinterest Account';

  try {
    const userRes = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.username || accountId;
    accountName = userRes.data.username || accountName;
  } catch (err) { console.warn('Could not fetch Pinterest user info:', err.message); }

  return { accountId, accountName, email: '', accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in, scope: 'boards:read,pins:read,pins:create' };
}

// ─── Snapchat ─────────────────────────────────────────────────────────────────

async function exchangeSnapchatToken(clientId, clientSecret, code, redirectUri, config) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    config.tokenEndpoint,
    new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;
  let accountId = 'snapchat-user', accountName = 'Snapchat Account';

  try {
    const userRes = await axios.get('https://kit.snapchat.com/v1/me?query={me{displayName,externalId}}', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.data?.me?.externalId  || accountId;
    accountName = userRes.data.data?.me?.displayName || accountName;
  } catch (err) { console.warn('Could not fetch Snapchat user info:', err.message); }

  return { accountId, accountName, email: '', accessToken: access_token, refreshToken: refresh_token, expiresIn: expires_in, scope: 'snapchat-marketing-api' };
}