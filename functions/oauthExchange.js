// oauthExchange.js
// Cloud Function to handle OAuth authorization code exchange
// Exchanges authorization codes from social platforms for access tokens
// Deployed as: https://marketmind-02.netlify.app/.netlify/functions/oauth-exchange

const axios = require('axios');

/**
 * OAuth configuration for different platforms
 * Add your client IDs and secrets from each platform's developer console
 */
const OAUTH_CONFIG = {
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  },
  meta: {
    clientId: process.env.META_CLIENT_ID,
    clientSecret: process.env.META_CLIENT_SECRET,
    tokenEndpoint: 'https://graph.instagram.com/v18.0/oauth/access_token',
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    tokenEndpoint: 'https://open.tiktokapis.com/v1/oauth/token',
  },
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    tokenEndpoint: 'https://graph.instagram.com/v18.0/oauth/access_token',
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    tokenEndpoint: 'https://token.twitter.com/2/oauth2/token',
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  },
  pinterest: {
    clientId: process.env.PINTEREST_CLIENT_ID,
    clientSecret: process.env.PINTEREST_CLIENT_SECRET,
    tokenEndpoint: 'https://api.pinterest.com/v1/oauth/token',
  },
  snapchat: {
    clientId: process.env.SNAPCHAT_CLIENT_ID,
    clientSecret: process.env.SNAPCHAT_CLIENT_SECRET,
    tokenEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/token',
  },
};

/**
 * Exchange authorization code for access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
module.exports.oauthExchange = async (req, res) => {
  try {
    // CORS headers
    res.set('Access-Control-Allow-Origin', 'https://marketmind-02.netlify.app');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only accept POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { platform, code, redirectUri, userId } = req.body;

    // Validate required fields
    if (!platform || !code || !redirectUri || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: platform, code, redirectUri, userId'
      });
    }

    // Get platform config
    const config = OAUTH_CONFIG[platform];
    if (!config) {
      return res.status(400).json({
        error: `Unsupported platform: ${platform}`
      });
    }

    // Verify Firebase token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    // TODO: Verify Firebase token
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // if (decodedToken.uid !== userId) {
    //   return res.status(403).json({ error: 'User ID mismatch' });
    // }

    // Exchange code for token based on platform
    let tokenData;

    switch (platform) {
      case 'youtube':
      case 'meta':
      case 'facebook':
      case 'instagram':
        tokenData = await exchangeYouTubeToken(code, redirectUri, config);
        break;
      case 'tiktok':
        tokenData = await exchangeTikTokToken(code, redirectUri, config);
        break;
      case 'twitter':
        tokenData = await exchangeTwitterToken(code, redirectUri, config);
        break;
      case 'linkedin':
        tokenData = await exchangeLinkedInToken(code, redirectUri, config);
        break;
      case 'pinterest':
        tokenData = await exchangePinterestToken(code, redirectUri, config);
        break;
      case 'snapchat':
        tokenData = await exchangeSnapchatToken(code, redirectUri, config);
        break;
      default:
        return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    // Successfully exchanged token
    return res.status(200).json({
      success: true,
      platform,
      accountId: tokenData.accountId,
      accountName: tokenData.accountName,
      email: tokenData.email,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      scope: tokenData.scope,
    });

  } catch (error) {
    console.error('OAuth exchange error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to exchange authorization code'
    });
  }
};

/**
 * Exchange authorization code for YouTube/Google token
 */
async function exchangeYouTubeToken(code, redirectUri, config) {
  const response = await axios.post(config.tokenEndpoint, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in, scope } = response.data;

  // Optionally get user info
  let userInfo = { id: 'unknown', email: '', name: '' };
  try {
    const userResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    userInfo = userResponse.data;
  } catch (err) {
    console.warn('Could not fetch YouTube user info:', err.message);
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

/**
 * Exchange authorization code for TikTok token
 */
async function exchangeTikTokToken(code, redirectUri, config) {
  const response = await axios.post(config.tokenEndpoint, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
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

/**
 * Exchange authorization code for Twitter token
 */
async function exchangeTwitterToken(code, redirectUri, config) {
  const response = await axios.post(config.tokenEndpoint, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });

  const { access_token, refresh_token, expires_in } = response.data;

  // Get user info
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

/**
 * Exchange authorization code for LinkedIn token
 */
async function exchangeLinkedInToken(code, redirectUri, config) {
  const response = await axios.post(config.tokenEndpoint, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in } = response.data;

  // Get user info
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

/**
 * Exchange authorization code for Pinterest token
 */
async function exchangePinterestToken(code, redirectUri, config) {
  const response = await axios.post(config.tokenEndpoint, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
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

/**
 * Exchange authorization code for Snapchat token
 */
async function exchangeSnapchatToken(code, redirectUri, config) {
  const response = await axios.post(config.tokenEndpoint, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
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
