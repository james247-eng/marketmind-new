// netlify/functions/oauth-exchange.js
// Netlify Function wrapper for OAuth code exchange
// This is the deployment-ready version for Netlify

const axios = require('axios');

// OAuth platform configurations
const PLATFORM_CONFIGS = {
  youtube: {
    endpoint: 'https://oauth2.googleapis.com/token',
  },
  meta: {
    endpoint: 'https://graph.instagram.com/v18.0/oauth/access_token',
  },
  facebook: {
    endpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  tiktok: {
    endpoint: 'https://open.tiktokapis.com/v1/oauth/token',
  },
  instagram: {
    endpoint: 'https://graph.instagram.com/v18.0/oauth/access_token',
  },
  twitter: {
    endpoint: 'https://token.twitter.com/2/oauth2/token',
  },
  linkedin: {
    endpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  },
  pinterest: {
    endpoint: 'https://api.pinterest.com/v1/oauth/token',
  },
  snapchat: {
    endpoint: 'https://accounts.snapchat.com/accounts/oauth2/token',
  },
};

// Get client secret from environment
const getClientSecret = (platform) => {
  const secretEnv = `${platform.toUpperCase()}_CLIENT_SECRET`;
  const secret = process.env[secretEnv];
  if (!secret) {
    throw new Error(`Missing environment variable: ${secretEnv}`);
  }
  return secret;
};

// Get client ID from environment
const getClientId = (platform) => {
  const idEnv = `${platform.toUpperCase()}_CLIENT_ID`;
  const id = process.env[idEnv];
  if (!id) {
    throw new Error(`Missing environment variable: ${idEnv}`);
  }
  return id;
};

// Main handler
exports.handler = async (event, context) => {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin': 'https://marketmind-02.netlify.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  try {
    // Only POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Parse body
    const { platform, code, redirectUri, userId } = JSON.parse(event.body);

    // Validate
    if (!platform || !code || !redirectUri || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: platform, code, redirectUri, userId',
        }),
      };
    }

    // Check platform support
    if (!PLATFORM_CONFIGS[platform]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unsupported platform: ${platform}` }),
      };
    }

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(
      platform,
      code,
      redirectUri
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        platform,
        accountId: tokenResponse.accountId,
        accountName: tokenResponse.accountName,
        email: tokenResponse.email || '',
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken || null,
        expiresIn: tokenResponse.expiresIn,
        scope: tokenResponse.scope || '',
      }),
    };
  } catch (error) {
    console.error('OAuth exchange error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to exchange authorization code',
      }),
    };
  }
};

// Platform-specific code exchange
async function exchangeCodeForToken(platform, code, redirectUri) {
  const clientId = getClientId(platform);
  const clientSecret = getClientSecret(platform);
  const config = PLATFORM_CONFIGS[platform];

  switch (platform) {
    case 'youtube':
    case 'meta':
    case 'facebook':
    case 'instagram':
      return exchangeGoogleToken(clientId, clientSecret, code, redirectUri, config);
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

async function exchangeGoogleToken(clientId, clientSecret, code, redirectUri, config) {
  const response = await axios.post(config.endpoint, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in, scope } = response.data;

  let userInfo = { id: 'unknown', email: '', name: '' };
  try {
    const userResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    userInfo = userResponse.data;
  } catch (err) {
    console.warn('Could not fetch user info:', err.message);
  }

  return {
    accountId: userInfo.id,
    accountName: userInfo.name || userInfo.email,
    email: userInfo.email,
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    scope: scope || '',
  };
}

async function exchangeTikTokToken(clientId, clientSecret, code, redirectUri, config) {
  const response = await axios.post(config.endpoint, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in, open_id } = response.data;

  return {
    accountId: open_id,
    accountName: open_id,
    email: '',
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    scope: 'user.info.basic,video.list,video.publish',
  };
}

async function exchangeTwitterToken(clientId, clientSecret, code, redirectUri, config) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await axios.post(config.endpoint, {
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: 'challenge',
  }, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });

  const { access_token, refresh_token, expires_in } = response.data;

  let userInfo = { id: 'unknown', username: '', name: '' };
  try {
    const userResponse = await axios.get(
      'https://api.twitter.com/2/users/me',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    userInfo = userResponse.data.data;
  } catch (err) {
    console.warn('Could not fetch Twitter user info:', err.message);
  }

  return {
    accountId: userInfo.id,
    accountName: userInfo.username || userInfo.name,
    email: '',
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    scope: 'tweet.write tweet.read users.read',
  };
}

async function exchangeLinkedInToken(clientId, clientSecret, code, redirectUri, config) {
  const response = await axios.post(config.endpoint, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in } = response.data;

  let userInfo = { id: 'unknown', localizedFirstName: '', localizedLastName: '' };
  try {
    const userResponse = await axios.get(
      'https://api.linkedin.com/v2/me',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    userInfo = userResponse.data;
  } catch (err) {
    console.warn('Could not fetch LinkedIn user info:', err.message);
  }

  return {
    accountId: userInfo.id,
    accountName: `${userInfo.localizedFirstName} ${userInfo.localizedLastName}`.trim(),
    email: '',
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    scope: 'r_basicprofile w_member_social',
  };
}

async function exchangePinterestToken(clientId, clientSecret, code, redirectUri, config) {
  const response = await axios.post(config.endpoint, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in } = response.data;

  return {
    accountId: 'pinterest-user',
    accountName: 'Pinterest Account',
    email: '',
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    scope: 'boards:read,pins:read,pins:create',
  };
}

async function exchangeSnapchatToken(clientId, clientSecret, code, redirectUri, config) {
  const response = await axios.post(config.endpoint, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in } = response.data;

  return {
    accountId: 'snapchat-user',
    accountName: 'Snapchat Account',
    email: '',
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    scope: 'snapchat-marketing-api',
  };
}
