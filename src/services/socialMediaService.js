// socialMediaService.js
// OAuth connections + social media posting
//
// ARCHITECTURE:
// - connect*()         → redirect to platform OAuth (browser is fine)
// - handle*Callback()  → Netlify oauthExchange → Firestore
// - post*()            → Netlify post-to-platform → platform API
// - getConnectedAccounts() / disconnectAccount() → Firestore only
//
// ALL outbound HTTP to external APIs goes through Netlify Functions.
// Firebase is used ONLY for Firestore reads/writes.

import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const REDIRECT_URI = window.location.origin + '/accounts';

// ─── Netlify helpers ──────────────────────────────────────────────────────────

const exchangeViaNetlify = async (platform, code, userId) => {
  const response = await fetch('/.netlify/functions/oauthExchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, code, redirectUri: REDIRECT_URI, userId }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || `Failed to exchange ${platform} token`);
  }
  return data;
};

// Single entry point for all platform posting.
const postViaNetlify = async (payload) => {
  const response = await fetch('/.netlify/functions/post-to-platform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || `Failed to post to ${payload.platform}`);
  }
  return data;
};

// ─── Save account to Firestore ────────────────────────────────────────────────

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

// =============== FACEBOOK =====================================================

export const connectFacebook = () => {
  const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || 'placeholder';
  const scope    = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';
  const authUrl  =
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&state=facebook`;
  window.location.href = authUrl;
};

export const handleFacebookCallback = async (code, userId) => {
  try {
    const data = await exchangeViaNetlify('facebook', code, userId);

    if (data.multiple && Array.isArray(data.accounts)) {
      // Save each Facebook Page as a separate account so user can choose which to post to
      for (const page of data.accounts) {
        await saveAccountToFirestore(userId, 'facebook', page);
      }
      return { success: true, pageCount: data.accounts.length };
    } else {
      await saveAccountToFirestore(userId, 'facebook', data);
      return { success: true };
    }
  } catch (error) {
    console.error('Facebook auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToFacebook = async (pageId, accessToken, content, mediaUrl = null) => {
  try {
    return await postViaNetlify({ platform: 'facebook', pageId, accessToken, content, mediaUrl });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== INSTAGRAM ====================================================

export const connectInstagram = () => {
  const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || 'placeholder';
  const scope    = 'instagram_basic,instagram_content_publish,pages_read_engagement';
  const authUrl  =
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&state=instagram`;
  window.location.href = authUrl;
};

export const handleInstagramCallback = async (code, userId) => {
  try {
    const data = await exchangeViaNetlify('instagram', code, userId);

    if (data.multiple && Array.isArray(data.accounts)) {
      for (const page of data.accounts) {
        await saveAccountToFirestore(userId, 'instagram', page);
      }
      return { success: true, pageCount: data.accounts.length };
    } else {
      await saveAccountToFirestore(userId, 'instagram', data);
      return { success: true };
    }
  } catch (error) {
    console.error('Instagram auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToInstagram = async (accountId, accessToken, imageUrl, caption) => {
  try {
    return await postViaNetlify({
      platform: 'instagram', accountId, accessToken,
      content: caption, mediaUrl: imageUrl,
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== TIKTOK =======================================================

export const connectTikTok = () => {
  const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || 'placeholder';
  const scope     = 'user.info.basic,video.upload,video.publish';
  const authUrl   =
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${clientKey}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=tiktok`;
  window.location.href = authUrl;
};

export const handleTikTokCallback = async (code, userId) => {
  try {
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
    return await postViaNetlify({ platform: 'tiktok', accessToken, content: caption, mediaUrl: videoUrl });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== TWITTER / X ==================================================

export const connectTwitter = () => {
  const apiKey  = import.meta.env.VITE_TWITTER_API_KEY || 'placeholder';
  const scope   = 'tweet.read tweet.write users.read offline.access';
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
    const tokenData = await exchangeViaNetlify('twitter', code, userId);
    await saveAccountToFirestore(userId, 'twitter', tokenData);
    return { success: true };
  } catch (error) {
    console.error('Twitter auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToTwitter = async (accessToken, content) => {
  try {
    return await postViaNetlify({ platform: 'twitter', accessToken, content });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== YOUTUBE ======================================================

export const connectYouTube = () => {
  const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID || 'placeholder';
  const scope    = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
  ].join(' ');
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&state=youtube`;
  window.location.href = authUrl;
};

export const handleYouTubeCallback = async (code, userId) => {
  try {
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
    return await postViaNetlify({ platform: 'youtube', accessToken, content: description, mediaUrl: videoUrl, title, description });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== COMMON =======================================================

export const getConnectedAccounts = async (userId) => {
  try {
    const q = query(collection(db, 'socialAccounts'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return { success: true, accounts: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
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

// Posts to multiple platforms using per-platform content.
// contentByPlatform: JSON string or object { twitter, linkedin, instagram, tiktok, youtube }
export const postToMultiplePlatforms = async (accounts, contentByPlatform, mediaUrl = null) => {
  let parsed = contentByPlatform;
  if (typeof contentByPlatform === 'string') {
    try { parsed = JSON.parse(contentByPlatform); } catch { parsed = {}; }
  }

  const results = [];
  for (const account of accounts) {
    const { platform, accountId, accessToken, accountName } = account;
    const platformContent = parsed[platform] || parsed.twitter || String(contentByPlatform);

    let result;
    try {
      switch (platform) {
        case 'facebook':
          result = await postToFacebook(accountId, accessToken, platformContent, mediaUrl); break;
        case 'instagram':
          result = await postToInstagram(accountId, accessToken, mediaUrl, platformContent); break;
        case 'twitter':
          result = await postToTwitter(accessToken, platformContent); break;
        case 'tiktok':
          result = await postToTikTok(accessToken, mediaUrl, platformContent); break;
        case 'youtube':
          result = await postToYouTube(accessToken, mediaUrl, platformContent.slice(0, 100), platformContent); break;
        default:
          result = { success: false, error: `Unsupported platform: ${platform}` };
      }
    } catch (err) {
      result = { success: false, error: err.message };
    }
    results.push({ platform, accountName, ...result });
  }
  return results;
};