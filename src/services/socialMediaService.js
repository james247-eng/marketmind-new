// socialMediaService.js
// OAuth connections + social media posting
//
// ALL outbound HTTP to external APIs goes through Netlify Functions.
// Firebase is used ONLY for Firestore reads/writes.

import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';
import COLLECTIONS from '../lib/schema.js';

const REDIRECT_URI = window.location.origin + '/accounts';

// ─── Netlify helpers ──────────────────────────────────────────────────────────

const exchangeViaNetlify = async (platform, code, workspaceId) => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to connect a social account');
  const response = await fetch('/.netlify/functions/oauthExchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ platform, code, redirectUri: REDIRECT_URI, workspaceId }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || `Failed to exchange ${platform} token`);
  }
  return data;
};

// Single entry point for all platform posting.
const postViaNetlify = async (payload) => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('You must be signed in to publish');
  const response = await fetch('/.netlify/functions/resolve-and-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to post to platform');
  }
  return data;
};

// ─── Direct Platform posting abstractions ────────────────────────────────────

export const postToFacebook = async (pageId, message, link, workspaceId) => {
  return postViaNetlify({ platform: 'facebook', accountId: pageId, workspaceId, content: message, mediaUrl: link });
};

export const postToInstagram = async (accountId, imageUrl, caption, workspaceId) => postViaNetlify({ platform: 'instagram', accountId, workspaceId, mediaUrl: imageUrl, content: caption });
};

export const postToTwitter = async (accountId, text, workspaceId) => {
  return postViaNetlify({ platform: 'twitter', accountId, workspaceId, content: text });
};

export const postToTikTok = async (accountId, videoUrl, title, workspaceId) => {
  return postViaNetlify({ platform: 'tiktok', accountId, workspaceId, mediaUrl: videoUrl, content: title });
};

export const postToYouTube = async (accountId, videoUrl, title, description, workspaceId) => {
  return postViaNetlify({ platform: 'youtube', accountId, workspaceId, mediaUrl: videoUrl, title, description, content: title });
};

// ─── Account management (Firestore Only) ──────────────────────────────────────

export const getConnectedAccounts = async (_userId, workspaceId) => {
  try {
    const q = query(collection(db, COLLECTIONS.socialConnections(workspaceId)));
    const snapshot = await getDocs(q);
    const accounts = snapshot.docs.map(d => {
      const data = d.data();
      return { id: d.id, workspaceId, userId: data.userId, platform: data.platform, accountId: data.accountId, accountName: data.accountName, connectedAt: data.connectedAt };
    });
    return { success: true, accounts };
  } catch (err) {
    console.error('Error fetching accounts from firestore:', err);
    return { success: false, error: err.message };
  }
};

export const disconnectAccount = async (workspaceId, accountDocId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.socialConnections(workspaceId), accountDocId));
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

export const handleFacebookCallback = async (code, _userId, workspaceId) => {
  try {
    const data = await exchangeViaNetlify('facebook', code, workspaceId);
    return { success: true, message: `Connected ${(data.accounts || []).length} Facebook/Instagram pages successfully.` };
  } catch (err) {
    console.error('FB callback exception handling:', err);
    return { success: false, error: err.message };
  }
};

export const handleTikTokCallback = async (code, _userId, workspaceId) => {
  try {
    const data = await exchangeViaNetlify('tiktok', code, workspaceId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const handleTwitterCallback = async (code, _userId, workspaceId) => {
  try {
    const data = await exchangeViaNetlify('twitter', code, workspaceId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const handleYouTubeCallback = async (code, _userId, workspaceId) => {
  try {
    const data = await exchangeViaNetlify('youtube', code, workspaceId);
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
    const { platform, accountId, accountName } = account;
    
    // Resilient content resolution fallback sequence
    const platformContent = parsed[platform] || parsed.twitter || (typeof contentByPlatform === 'string' ? contentByPlatform : '');

    let result;
    try {
      switch (platform) {
        case 'facebook':
          result = await postToFacebook(accountId, platformContent, mediaUrl, account.workspaceId); 
          break;
        case 'instagram':
          result = await postToInstagram(accountId, mediaUrl, platformContent, account.workspaceId); 
          break;
        case 'twitter':
          result = await postToTwitter(accountId, platformContent, account.workspaceId); 
          break;
        case 'tiktok':
          result = await postToTikTok(accountId, mediaUrl, platformContent, account.workspaceId); 
          break;
        case 'youtube':
          result = await postToYouTube(accountId, mediaUrl, platformContent.slice(0, 100), platformContent, account.workspaceId); 
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
