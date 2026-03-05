// socialMediaService.js
// Handles OAuth connections - secure backend only

import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// NOTE: Firebase httpsCallable is no longer used for OAuth token exchange.
// Outbound requests to external APIs (Facebook, Google, etc.) are handled
// by Netlify Functions to avoid Firebase Spark plan billing restrictions.
// Firebase is still used for Firestore (database reads/writes only).

const REDIRECT_URI = window.location.origin + '/accounts';

// ─── Netlify Function Helper ──────────────────────────────────────────────────
// Central helper for all OAuth code exchanges via Netlify.
// oauth-exchange.js on Netlify handles the secret keys server-side.

const exchangeViaNetlify = async (platform, code, userId) => {
  const response = await fetch('/.netlify/functions/oauth-exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform,
      code,
      redirectUri: REDIRECT_URI,
      userId, // Passed for logging purposes on the Netlify side
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Failed to exchange ${platform} token`);
  }

  // Netlify function returns a flat object:
  // { success, platform, accountId, accountName, email, accessToken, refreshToken, expiresIn, scope }
  return data;
};

// ─── Save Account to Firestore ────────────────────────────────────────────────
// Shared helper to persist a connected account. Keeps the socialAccounts
// collection structure identical to the original implementation.

const saveAccountToFirestore = async (userId, platform, tokenData) => {
  await addDoc(collection(db, 'socialAccounts'), {
    userId,
    platform,
    accountId:    tokenData.accountId,
    accountName:  tokenData.accountName,
    email:        tokenData.email        || '',
    accessToken:  tokenData.accessToken,
    refreshToken: tokenData.refreshToken || null,
    expiresIn:    tokenData.expiresIn    || null,
    scope:        tokenData.scope        || '',
    connectedAt:  new Date().toISOString(),
  });
};

// =============== FACEBOOK / INSTAGRAM ========================================

export const connectFacebook = () => {
  // App ID is public — safe to expose in the frontend for the OAuth redirect.
  const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || 'placeholder';
  const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';

  const authUrl =
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&response_type=code` +
        `&state=facebook`;   // ✅ add this


  window.location.href = authUrl;
};

export const handleFacebookCallback = async (code, userId) => {
  try {
    // Previously used Firebase httpsCallable('exchangeFacebookToken').
    // Now calls the Netlify function so the FACEBOOK_APP_SECRET never
    // touches the client and Firebase billing is not triggered.
    const tokenData = await exchangeViaNetlify('facebook', code, userId);

    // The old Firebase function returned an array of Pages; the Netlify
    // function returns a single account object. Save it the same way.
    await saveAccountToFirestore(userId, 'facebook', tokenData);

    return { success: true };
  } catch (error) {
    console.error('Facebook auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToFacebook = async (pageId, accessToken, content, imageUrl) => {
  try {
    // Posting still goes through Firebase Cloud Functions because it is a
    // write action (not an outbound token exchange) and already existed.
    // If you hit billing issues here too, mirror the pattern above and
    // create a `post-to-platform.js` Netlify function.
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('./firebase');

    const postFunction = httpsCallable(functions, 'postToFacebook');
    const result = await postFunction({ pageId, accessToken, content, imageUrl });

    return {
      success: result.data.success,
      postId:  result.data.postId,
      error:   result.data.error,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== TIKTOK ======================================================

export const connectTikTok = () => {
  const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || 'placeholder';
  const scope = 'user.info.basic,video.upload,video.publish';

  const authUrl =
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientKey}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  window.location.href = authUrl;
};

export const handleTikTokCallback = async (code, userId) => {
  try {
    // Moved to Netlify to keep VITE_TIKTOK_CLIENT_SECRET off the client.
    const tokenData = await exchangeViaNetlify('tiktok', code, userId);
    await saveAccountToFirestore(userId, 'tiktok', tokenData);
    return { success: true };
  } catch (error) {
    console.error('TikTok auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToTikTok = async (accessToken, videoUrl, caption) => {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_url: videoUrl,
        },
      }),
    });

    const data = await response.json();

    return {
      success: !!data.data?.publish_id,
      postId:  data.data?.publish_id,
      error:   data.error?.message,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== TWITTER / X =================================================

export const connectTwitter = () => {
  const apiKey = import.meta.env.VITE_TWITTER_API_KEY || 'placeholder';
  const scope = 'tweet.read tweet.write users.read offline.access';

  const authUrl =
    `https://twitter.com/i/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${apiKey}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=twitter` +
    `&code_challenge=challenge` +
    `&code_challenge_method=plain`;

  window.location.href = authUrl;
};

export const handleTwitterCallback = async (code, userId) => {
  try {
    // Moved to Netlify to keep VITE_TWITTER_API_SECRET off the client.
    const tokenData = await exchangeViaNetlify('twitter', code, userId);
    await saveAccountToFirestore(userId, 'twitter', tokenData);
    return { success: true };
  } catch (error) {
    console.error('Twitter auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToTwitter = async (accessToken, content, mediaUrl) => {
  try {
    let mediaId = null;

    if (mediaUrl) {
      const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media_url: mediaUrl }),
      });
      const mediaData = await mediaResponse.json();
      mediaId = mediaData.media_id_string;
    }

    const tweetBody = { text: content };
    if (mediaId) tweetBody.media = { media_ids: [mediaId] };

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetBody),
    });

    const data = await response.json();

    return {
      success: !!data.data?.id,
      postId:  data.data?.id,
      error:   data.errors?.[0]?.message,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== INSTAGRAM ===================================================

export const postToInstagram = async (accountId, accessToken, imageUrl, caption) => {
  try {
    // Step 1: Create media container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });

    const containerData = await containerResponse.json();
    if (containerData.error) throw new Error(containerData.error.message);

    // Step 2: Publish media
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
    });

    const publishData = await publishResponse.json();

    return {
      success: !publishData.error,
      postId:  publishData.id,
      error:   publishData.error?.message,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== YOUTUBE =====================================================

export const connectYouTube = () => {
  const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID || 'placeholder';
  const scope = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
  ].join(' ');

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline`;

  window.location.href = authUrl;
};

export const handleYouTubeCallback = async (code, userId) => {
  try {
    // Moved to Netlify to keep VITE_YOUTUBE_CLIENT_SECRET off the client.
    const tokenData = await exchangeViaNetlify('youtube', code, userId);
    await saveAccountToFirestore(userId, 'youtube', tokenData);
    return { success: true };
  } catch (error) {
    console.error('YouTube auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToYouTube = async (accessToken, videoUrl, title, description) => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: { title, description, categoryId: '22' },
          status:  { privacyStatus: 'public' },
        }),
      }
    );

    const data = await response.json();

    return {
      success: !!data.id,
      postId:  data.id,
      error:   data.error?.message,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== COMMON FUNCTIONS ============================================

export const getConnectedAccounts = async (userId) => {
  try {
    const q = query(
      collection(db, 'socialAccounts'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const accounts = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, accounts };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return { success: false, error: error.message };
  }
};

export const disconnectAccount = async (accountId) => {
  try {
    await deleteDoc(doc(db, 'socialAccounts', accountId));
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return { success: false, error: error.message };
  }
};

export const postToMultiplePlatforms = async (accounts, content, mediaUrl) => {
  const results = [];

  for (const account of accounts) {
    let result;

    switch (account.platform) {
      case 'facebook':
        result = await postToFacebook(account.accountId, account.accessToken, content, mediaUrl);
        break;
      case 'twitter':
        result = await postToTwitter(account.accessToken, content, mediaUrl);
        break;
      case 'instagram':
        result = await postToInstagram(account.accountId, account.accessToken, mediaUrl, content);
        break;
      case 'tiktok':
        result = await postToTikTok(account.accessToken, mediaUrl, content);
        break;
      case 'youtube':
        result = await postToYouTube(account.accessToken, mediaUrl, content.slice(0, 100), content);
        break;
      default:
        result = { success: false, error: 'Unknown platform' };
    }

    results.push({ platform: account.platform, accountName: account.accountName, ...result });
  }

  return results;
};