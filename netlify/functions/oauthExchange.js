// netlify/functions/oauthExchange.js
// Handles OAuth authorization code exchange for all social platforms.
// Keeps client-facing authentication modular and clear.

const axios = require('axios');
const admin = require('firebase-admin');
const { encryptToken } = require('./lib/tokenEncryption');
const COLLECTIONS = require('./lib/schema.cjs');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
const db = admin.firestore();

const CORS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

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
  if (!value) throw new Error(`Missing environment variable configuration for secret: ${envVar}`);
  return value;
};

const getClientId = (platform) => {
  const key    = platform === 'instagram' ? 'facebook' : platform;
  const envVar = `${key.toUpperCase()}_CLIENT_ID`;
  const value  = process.env[envVar];
  if (!value) throw new Error(`Missing environment variable configuration for ID: ${envVar}`);
  return value;
};

// ─── Platform Exchange Adapters ──────────────────────────────────────────────

async function exchangeFacebookToken(clientId, clientSecret, code, redirectUri) {
  // 1. Exchange temporary authorization code for user short-lived access token
  const tokenRes = await axios.get(PLATFORM_CONFIGS.facebook.tokenEndpoint, {
    params: { client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code }
  });
  
  const userAccessToken = tokenRes.data.access_token;

  // 2. Query all Facebook Pages managed by the authenticated user profile
  const pagesRes = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
    params: { access_token: userAccessToken }
  });

  const rawPages = pagesRes.data.data || [];
  const processedAccounts = [];

  // 3. For each page, structure details and attempt to check for an attached Instagram Business account
  for (const page of rawPages) {
    processedAccounts.push({
      accountId: page.id,
      accountName: page.name || 'Unnamed Facebook Page',
      accessToken: page.access_token, // Page-scoped perpetual tokens
    });

    try {
      const igRes = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
        params: { fields: 'instagram_business_account', access_token: page.access_token }
      });
      
      if (igRes.data?.instagram_business_account?.id) {
        processedAccounts.push({
          accountId: igRes.data.instagram_business_account.id,
          accountName: `${page.name} (Linked Instagram Profile)`,
          accessToken: page.access_token, // Instagram operations route through Page tokens
        });
      }
    } catch (igErr) {
      console.warn(`[oauthExchange] Skipping Instagram scan for Page ${page.id}:`, igErr.message);
    }
  }

  return {
    multiple: true,
    platform: 'facebook',
    accounts: processedAccounts
  };
}

async function exchangeTikTokToken(clientId, clientSecret, code, redirectUri) {
  const tokenRes = await axios.post(
    PLATFORM_CONFIGS.tiktok.tokenEndpoint,
    new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { open_id, access_token, refresh_token } = tokenRes.data;
  let accountName = 'TikTok User';

  try {
    const userRes = await axios.post(
      'https://open.tiktokapis.com/v2/user/info/',
      {},
      { headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' } }
    );
    accountName = userRes.data.data?.user?.display_name || accountName;
  } catch (err) {
    console.warn('[oauthExchange] Failed to query TikTok user context profiles info:', err.message);
  }

  return { accountId: open_id, accountName, accessToken: access_token, refreshToken: refresh_token };
}

async function exchangeTwitterToken(clientId, clientSecret, code, redirectUri) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    PLATFORM_CONFIGS.twitter.tokenEndpoint,
    new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: 'challenge', // Fixed matching challenge token signature string
    }),
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token } = tokenRes.data;
  let accountId = 'twitter-user', accountName = 'Twitter/X Account';

  try {
    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    accountId = userRes.data.data?.id || accountId;
    accountName = userRes.data.data?.name || accountName;
  } catch (err) {
    console.warn('[oauthExchange] Failed to fetch Twitter user profile metrics:', err.message);
  }

  return { accountId, accountName, accessToken: access_token, refreshToken: refresh_token };
}

async function exchangeYouTubeToken(clientId, clientSecret, code, redirectUri) {
  const tokenRes = await axios.post(
    PLATFORM_CONFIGS.youtube.tokenEndpoint,
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token } = tokenRes.data;
  let accountId = 'youtube-channel', accountName = 'YouTube Channel';

  try {
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (channelRes.data.items?.[0]) {
      accountId = channelRes.data.items[0].id;
      accountName = channelRes.data.items[0].snippet?.title || accountName;
    }
  } catch (err) {
    console.warn('[oauthExchange] Failed to fetch YouTube channel profile metrics:', err.message);
  }

  return { accountId, accountName, accessToken: access_token, refreshToken: refresh_token };
}

async function exchangeLinkedInToken(clientId, clientSecret, code, redirectUri) {
  const tokenRes = await axios.post(
    PLATFORM_CONFIGS.linkedin.tokenEndpoint,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token } = tokenRes.data;
  let accountId = 'linkedin-profile', accountName = 'LinkedIn Member';

  try {
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    accountId = profileRes.data.sub || accountId;
    accountName = `${profileRes.data.given_name || ''} ${profileRes.data.family_name || ''}`.trim() || accountName;
  } catch (err) {
    console.warn('[oauthExchange] Failed to query userinfo profile for LinkedIn:', err.message);
  }

  return { accountId, accountName, accessToken: access_token };
}

async function exchangePinterestToken(clientId, clientSecret, code, redirectUri) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    PLATFORM_CONFIGS.pinterest.tokenEndpoint,
    new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token } = tokenRes.data;
  let accountId = 'pinterest-user', accountName = 'Pinterest Account';

  try {
    const userRes = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId = userRes.data.username || accountId;
    accountName = userRes.data.username || accountName;
  } catch (err) {
    console.warn('[oauthExchange] Could not retrieve user account context metadata for Pinterest:', err.message);
  }

  return { accountId, accountName, accessToken: access_token, refreshToken: refresh_token };
}

async function exchangeSnapchatToken(clientId, clientSecret, code, redirectUri) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    PLATFORM_CONFIGS.snapchat.tokenEndpoint,
    new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, refresh_token } = tokenRes.data;
  let accountId = 'snapchat-user', accountName = 'Snapchat Account';

  try {
    const userRes = await axios.get('https://kit.snapchat.com/v1/me?query={me{displayName,externalId}}', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    accountId   = userRes.data.data?.me?.externalId  || accountId;
    accountName = userRes.data.data?.me?.displayName || accountName;
  } catch (err) {
    console.warn('[oauthExchange] Could not retrieve Snapchat profile metadata details:', err.message);
  }

  return { accountId, accountName, accessToken: access_token, refreshToken: refresh_token };
}

// ─── Main Execution Lambda Core Endpoint ─────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'HTTP Method Request option not allowed' }) };
  }

  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) throw new Error('Missing Firebase ID token');
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { platform, code, redirectUri, workspaceId } = JSON.parse(event.body);

    if (!platform || !code || !redirectUri || !workspaceId) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Missing mandatory payload request parameters: platform, code, redirectUri' }),
      };
    }

    if (!PLATFORM_CONFIGS[platform]) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Requested OAuth target platform options not supported: ${platform}` }) };
    }

    const clientId     = getClientId(platform);
    const clientSecret = getClientSecret(platform);
    let exchangeResult = null;

    switch (platform) {
      case 'facebook':
      case 'instagram':
        exchangeResult = await exchangeFacebookToken(clientId, clientSecret, code, redirectUri);
        break;
      case 'tiktok':
        exchangeResult = await exchangeTikTokToken(clientId, clientSecret, code, redirectUri);
        break;
      case 'twitter':
        exchangeResult = await exchangeTwitterToken(clientId, clientSecret, code, redirectUri);
        break;
      case 'youtube':
        exchangeResult = await exchangeYouTubeToken(clientId, clientSecret, code, redirectUri);
        break;
      case 'linkedin':
        exchangeResult = await exchangeLinkedInToken(clientId, clientSecret, code, redirectUri);
        break;
      case 'pinterest':
        exchangeResult = await exchangePinterestToken(clientId, clientSecret, code, redirectUri);
        break;
      case 'snapchat':
        exchangeResult = await exchangeSnapchatToken(clientId, clientSecret, code, redirectUri);
        break;
      default:
        throw new Error(`Execution adapter for target platform routing not mapped out internally: ${platform}`);
    }

    const accounts = exchangeResult.accounts || [exchangeResult];
    const metadata = [];
    for (const account of accounts) {
      await db.collection(COLLECTIONS.socialConnections(workspaceId)).add({
        workspaceId,
        userId: decoded.uid,
        platform: exchangeResult.platform || platform,
        accountId: account.accountId,
        accountName: account.accountName,
        accessToken: encryptToken(account.accessToken),
        refreshToken: encryptToken(account.refreshToken),
        connectedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      metadata.push({ accountId: account.accountId, accountName: account.accountName, platform: exchangeResult.platform || platform });
    }
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, platform: exchangeResult.platform || platform, accounts: metadata }),
    };

  } catch (error) {
    console.error('[oauthExchange] Process handling crashed:', error.response?.data || error.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        success: false,
        error: error.response?.data?.error_description || error.response?.data?.error || error.message,
      }),
    };
  }
};
