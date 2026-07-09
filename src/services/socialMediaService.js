// socialMediaService.js
// OAuth connections + social media posting
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
    throw new Error(data.error || 'Failed to post to platform');
  }
  return data;
};

// ─── Direct Platform posting abstractions ────────────────────────────────────

export const postToFacebook = async (pageId, accessToken, message, link = null) => {
  return postViaNetlify({ platform: 'facebook', pageId, accessToken, message, link });
};

export const postToInstagram = async (instagramBusinessAccountId, accessToken, imageUrl, caption) => {
  return postViaNetlify({ platform: 'instagram', instagramBusinessAccountId, accessToken, imageUrl, caption });
};

export const postToTwitter = async (accessToken, text) => {
  return postViaNetlify({ platform: 'twitter', accessToken, text });
};

export const postToTikTok = async (accessToken, videoUrl, title) => {
  return postViaNetlify({ platform: 'tiktok', accessToken, videoUrl, title });
};

export const postToYouTube = async (accessToken, videoUrl, title, description) => {
  return postViaNetlify({ platform: 'youtube', accessToken, videoUrl, title, description });
};

// ─── Account management (Firestore Only) ──────────────────────────────────────

export const getConnectedAccounts = async (userId) => {
  try {
    const q = query(collection(db, 'accounts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const accounts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, accounts };
  } catch (err) {
    console.error('Error fetching accounts from firestore:', err);
    return { success: false, error: err.message };
  }
};

export const disconnectAccount = async (accountDocId) => {
  try {
    await deleteDoc(doc(db, 'accounts', accountDocId));
    return { success: true };
  } catch (err) {
    console.error('Error deleting account from firestore:', err);
    return { success: false, error: err.message };
  }
};

// ─── OAuth Trigger Redirects ──────────────────────────────────────────────────

export const connectFacebook = () => {
  const fbAppId = '406853755355605'; 
  const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,pages_show_list';
  const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=facebook`;
  window.location.href = url;
};

export const connectTikTok = () => {
  const clientKey = 'awmq60b37f3pbeon'; 
  const scope = 'user.info.basic,video.publish,video.upload';
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=tiktok`;
  window.location.href = url;
};

export const connectTwitter = () => {
  const clientID = 'WUp3NXZ3YTNvMG5lOEdKcGstclU6MTpjaA'; 
  const scope = 'tweet.read tweet.write users.read offline.access';
  const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=twitter&code_challenge=challenge&code_challenge_method=plain`;
  window.location.href = url;
};

export const connectYouTube = () => {
  const clientId = '226296180373-c82p189onp26g5r93u2p6cbeehb6m794.apps.googleusercontent.com';
  const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&state=youtube&access_type=offline&prompt=select_account`;
  window.location.href = url;
};

// ─── OAuth Return Callback Handlers ───────────────────────────────────────────

export const handleFacebookCallback = async (code, userId) => {
  try {
    const data = await exchangeViaNetlify('facebook', code, userId);
    if (data.multiple && data.accounts) {
      let savedCount = 0;
      for (const account of data.accounts) {
        const q = query(
          collection(db, 'accounts'),
          where('userId', '==', userId),
          where('platform', '==', data.platform),
          where('accountId', '==', account.accountId)
        );
        const existing = await getDocs(q);
        if (existing.empty) {
          await addDoc(collection(db, 'accounts'), {
            userId,
            platform: data.platform,
            accountId: account.accountId,
            accountName: account.accountName,
            accessToken: account.accessToken,
            connectedAt: new Date().toISOString(),
          });
          savedCount++;
        }
      }
      return { success: true, message: `Connected ${savedCount} Facebook/Instagram pages successfully.` };
    }
    return { success: false, error: 'Malformed multi-account token data returned from exchange.' };
  } catch (err) {
    console.error('FB callback exception handling:', err);
    return { success: false, error: err.message };
  }
};

export const handleTikTokCallback = async (code, userId) => {
  try {
    const data = await exchangeViaNetlify('tiktok', code, userId);
    await addDoc(collection(db, 'accounts'), {
      userId,
      platform: 'tiktok',
      accountId: data.accountId,
      accountName: data.accountName || 'TikTok User',
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      connectedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const handleTwitterCallback = async (code, userId) => {
  try {
    const data = await exchangeViaNetlify('twitter', code, userId);
    await addDoc(collection(db, 'accounts'), {
      userId,
      platform: 'twitter',
      accountId: data.accountId,
      accountName: data.accountName || 'Twitter User',
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      connectedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const handleYouTubeCallback = async (code, userId) => {
  try {
    const data = await exchangeViaNetlify('youtube', code, userId);
    await addDoc(collection(db, 'accounts'), {
      userId,
      platform: 'youtube',
      accountId: data.accountId,
      accountName: data.accountName || 'YouTube Channel',
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      connectedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ─── Multi-Platform Posting Engine ───────────────────────────────────────────

export const postToMultiplePlatforms = async (accounts, contentByPlatform, mediaUrl = null) => {
  let parsed = contentByPlatform;
  
  if (typeof contentByPlatform === 'string') {
    try { 
      parsed = JSON.parse(contentByPlatform); 
    } catch { 
      // If parsing fails, fall back to treating it as un-tokenised raw content text
      parsed = {}; 
    }
  }

  const results = [];
  for (const account of accounts) {
    const { platform, accountId, accessToken, accountName } = account;
    
    // Resilient content resolution fallback sequence
    const platformContent = parsed[platform] || parsed.twitter || (typeof contentByPlatform === 'string' ? contentByPlatform : '');

    let result;
    try {
      switch (platform) {
        case 'facebook':
          result = await postToFacebook(accountId, accessToken, platformContent, mediaUrl); 
          break;
        case 'instagram':
          result = await postToInstagram(accountId, accessToken, mediaUrl, platformContent); 
          break;
        case 'twitter':
          result = await postToTwitter(accessToken, platformContent); 
          break;
        case 'tiktok':
          result = await postToTikTok(accessToken, mediaUrl, platformContent); 
          break;
        case 'youtube':
          result = await postToYouTube(accessToken, mediaUrl, platformContent.slice(0, 100), platformContent); 
          break;
        default:
          result = { success: false, error: `Unsupported platform option context: ${platform}` };
      }
    } catch (err) {
      result = { success: false, error: err.message };
    }
    results.push({ platform, accountName, ...result });
  }
  return results;
};