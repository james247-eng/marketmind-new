// socialAuthService.js
// Handles OAuth flows with social media platforms
// Manages authorization code exchange and token storage

import { db, auth } from './firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://marketmind-02.netlify.app';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://marketmind-02.netlify.app/.netlify/functions';

// Platform-specific OAuth configuration
const OAUTH_CONFIG = {
  youtube: {
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
    responseType: 'code',
  },
  meta: {
    authEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_manage_insights',
    responseType: 'code',
  },
  facebook: {
    authEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'pages_manage_posts,pages_read_engagement',
    responseType: 'code',
  },
  tiktok: {
    authEndpoint: 'https://www.tiktok.com/oauth/authorize',
    scope: 'user.info.basic,video.list,video.publish',
    responseType: 'code',
  },
  instagram: {
    authEndpoint: 'https://api.instagram.com/oauth/authorize',
    scope: 'instagram_business_basic,instagram_business_content_publish',
    responseType: 'code',
  },
  twitter: {
    authEndpoint: 'https://twitter.com/i/oauth2/authorize',
    scope: 'tweet.moderate.write tweet.write tweet.read users.read',
    responseType: 'code',
  },
  linkedin: {
    authEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
    scope: 'r_basicprofile w_member_social',
    responseType: 'code',
  },
  pinterest: {
    authEndpoint: 'https://api.pinterest.com/oauth/',
    scope: 'boards:read,pins:read,pins:create,pins:delete',
    responseType: 'code',
  },
  snapchat: {
    authEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/auth',
    scope: 'snapchat-marketing-api',
    responseType: 'code',
  }
};

/**
 * Generate OAuth authorization URL
 * @param {string} platform - Social media platform (youtube, meta, tiktok, etc.)
 * @param {string} clientId - Platform-specific client ID
 * @returns {string} Authorization URL
 */
export const generateAuthorizationUrl = (platform, clientId) => {
  const config = OAUTH_CONFIG[platform];
  
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Generate random state for CSRF protection
  const state = generateRandomString(32);
  sessionStorage.setItem(`oauth_state_${platform}`, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${APP_URL}/auth/${platform}/callback`,
    scope: config.scope,
    response_type: config.responseType,
    state: state,
    ...(platform === 'meta' && { display: 'popup' }),
    ...(platform === 'tiktok' && { scope: 'user.info.basic,video.list,video.publish' }),
  });

  return `${config.authEndpoint}?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 * This should be called from your backend for security
 * @param {string} platform - Social media platform
 * @param {string} code - Authorization code from OAuth provider
 * @param {string} state - State parameter for CSRF validation
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} Result object with success status
 */
export const exchangeAuthorizationCode = async (platform, code, state, userId) => {
  try {
    // Validate state for CSRF protection
    const savedState = sessionStorage.getItem(`oauth_state_${platform}`);
    if (state && savedState !== state) {
      throw new Error('State validation failed - potential CSRF attack');
    }
    sessionStorage.removeItem(`oauth_state_${platform}`);

    // Call your backend function to exchange code
    // Replace with your actual backend endpoint
    const response = await fetch(`${BACKEND_URL}/oauth-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`,
      },
      body: JSON.stringify({
        platform,
        code,
        userId,
        redirectUri: `${APP_URL}/auth/${platform}/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to connect ${platform}`
      };
    }

    // Store the social account connection in Firestore
    await storeSocialConnection(userId, platform, data);

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('OAuth exchange error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Store social account connection in Firestore
 * @param {string} userId - Firebase user ID
 * @param {string} platform - Social media platform
 * @param {Object} tokenData - Token and account data from OAuth provider
 */
export const storeSocialConnection = async (userId, platform, tokenData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const socialConnectionsRef = doc(db, 'users', userId, 'socialConnections', platform);

    // Store connection details
    await setDoc(socialConnectionsRef, {
      platform,
      connectedAt: new Date().toISOString(),
      accountId: tokenData.accountId || tokenData.id,
      accountName: tokenData.accountName || tokenData.name || '',
      email: tokenData.email || '',
      accessToken: tokenData.accessToken || '', // Should be encrypted!
      refreshToken: tokenData.refreshToken || '',
      expiresIn: tokenData.expiresIn || null,
      expiresAt: tokenData.expiresAt || new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000).toISOString(),
      scope: tokenData.scope || '',
      profileUrl: tokenData.profileUrl || '',
      profileImage: tokenData.profileImage || '',
      lastTokenRefresh: new Date().toISOString(),
    });

    // Update user's connected platforms list
    await updateDoc(userRef, {
      connectedPlatforms: arrayUnion(platform),
      lastUpdate: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error storing social connection:', error);
    throw error;
  }
};

/**
 * Get stored social connection for a user
 * @param {string} userId - Firebase user ID
 * @param {string} platform - Social media platform
 * @returns {Promise<Object|null>} Social connection data or null
 */
export const getSocialConnection = async (userId, platform) => {
  try {
    const socialConnectionRef = doc(db, 'users', userId, 'socialConnections', platform);
    const snapshot = await getDoc(socialConnectionRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Error getting social connection:', error);
    return null;
  }
};

/**
 * Get all social connections for a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object[]>} Array of social connections
 */
export const getAllSocialConnections = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const platforms = userDoc.data()?.connectedPlatforms || [];
    
    const connections = [];
    for (const platform of platforms) {
      const connection = await getSocialConnection(userId, platform);
      if (connection) {
        connections.push(connection);
      }
    }
    return connections;
  } catch (error) {
    console.error('Error getting all social connections:', error);
    return [];
  }
};

/**
 * Disconnect a social account
 * @param {string} userId - Firebase user ID
 * @param {string} platform - Social media platform
 * @returns {Promise<Object>} Result object
 */
export const disconnectSocialAccount = async (userId, platform) => {
  try {
    const socialConnectionRef = doc(db, 'users', userId, 'socialConnections', platform);
    await deleteDoc(socialConnectionRef);

    // Update user's connected platforms list
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const platforms = userDoc.data()?.connectedPlatforms || [];
    const updatedPlatforms = platforms.filter(p => p !== platform);
    
    await updateDoc(userRef, {
      connectedPlatforms: updatedPlatforms,
      lastUpdate: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Refresh an expired access token
 * @param {string} userId - Firebase user ID
 * @param {string} platform - Social media platform
 * @returns {Promise<Object>} Result object with new token data
 */
export const refreshAccessToken = async (userId, platform) => {
  try {
    const connection = await getSocialConnection(userId, platform);
    
    if (!connection || !connection.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      };
    }

    // Call backend to refresh token
    const response = await fetch(`${BACKEND_URL}/oauth-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`,
      },
      body: JSON.stringify({
        platform,
        refreshToken: connection.refreshToken,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to refresh token'
      };
    }

    // Update stored connection with new token
    const socialConnectionRef = doc(db, 'users', userId, 'socialConnections', platform);
    await updateDoc(socialConnectionRef, {
      accessToken: data.accessToken,
      expiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
      lastTokenRefresh: new Date().toISOString(),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a random string for state/nonce
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
export const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default {
  generateAuthorizationUrl,
  exchangeAuthorizationCode,
  storeSocialConnection,
  getSocialConnection,
  getAllSocialConnections,
  disconnectSocialAccount,
  refreshAccessToken,
  generateRandomString
};
