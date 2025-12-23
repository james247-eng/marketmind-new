// socialMediaService.js
// Handles OAuth connections and posting to social platforms

import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// OAuth Configuration
const REDIRECT_URI = window.location.origin + '/accounts';

// =============== FACEBOOK/INSTAGRAM ===============

export const connectFacebook = () => {
  const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || 'placeholder';
  const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${REDIRECT_URI}&scope=${scope}&response_type=code`;
  
  window.location.href = authUrl;
};

export const handleFacebookCallback = async (code, userId) => {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${import.meta.env.VITE_FACEBOOK_APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${import.meta.env.VITE_FACEBOOK_APP_SECRET}&code=${code}`);
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`);
    const pagesData = await pagesResponse.json();

    // Save each page to Firestore
    for (const page of pagesData.data) {
      await addDoc(collection(db, 'socialAccounts'), {
        userId: userId,
        platform: 'facebook',
        accountId: page.id,
        accountName: page.name,
        accessToken: page.access_token,
        connectedAt: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Facebook auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToFacebook = async (pageId, accessToken, content, imageUrl) => {
  try {
    const endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    
    const body = {
      message: content,
      access_token: accessToken
    };

    if (imageUrl) {
      body.link = imageUrl;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return {
      success: !data.error,
      postId: data.id,
      error: data.error?.message
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== TIKTOK ===============

export const connectTikTok = () => {
  const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || 'placeholder';
  const scope = 'user.info.basic,video.upload,video.publish';
  
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${REDIRECT_URI}`;
  
  window.location.href = authUrl;
};

export const handleTikTokCallback = async (code, userId) => {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: import.meta.env.VITE_TIKTOK_CLIENT_KEY,
        client_secret: import.meta.env.VITE_TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const userData = await userResponse.json();

    // Save to Firestore
    await addDoc(collection(db, 'socialAccounts'), {
      userId: userId,
      platform: 'tiktok',
      accountId: userData.data.user.open_id,
      accountName: userData.data.user.display_name,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      connectedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('TikTok auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToTikTok = async (accessToken, videoUrl, caption) => {
  try {
    // TikTok requires video to be uploaded first, then published
    // This is a simplified flow - actual implementation needs chunked upload
    
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: caption,
          privacy_level: 'SELF_ONLY', // or PUBLIC_TO_EVERYONE
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_url: videoUrl
        }
      })
    });

    const data = await response.json();
    
    return {
      success: data.data?.publish_id ? true : false,
      postId: data.data?.publish_id,
      error: data.error?.message
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== TWITTER/X ===============

export const connectTwitter = () => {
  const apiKey = import.meta.env.VITE_TWITTER_API_KEY || 'placeholder';
  
  // Twitter OAuth 2.0 flow
  const scope = 'tweet.read tweet.write users.read offline.access';
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${apiKey}&redirect_uri=${REDIRECT_URI}&scope=${scope}&state=twitter&code_challenge=challenge&code_challenge_method=plain`;
  
  window.location.href = authUrl;
};

export const handleTwitterCallback = async (code, userId) => {
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${import.meta.env.VITE_TWITTER_API_KEY}:${import.meta.env.VITE_TWITTER_API_SECRET}`)}`
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code_verifier: 'challenge'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const userData = await userResponse.json();

    // Save to Firestore
    await addDoc(collection(db, 'socialAccounts'), {
      userId: userId,
      platform: 'twitter',
      accountId: userData.data.id,
      accountName: userData.data.username,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      connectedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Twitter auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToTwitter = async (accessToken, content, mediaUrl) => {
  try {
    let mediaId = null;

    // Upload media if provided
    if (mediaUrl) {
      const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ media_url: mediaUrl })
      });
      
      const mediaData = await mediaResponse.json();
      mediaId = mediaData.media_id_string;
    }

    // Post tweet
    const tweetBody = {
      text: content
    };

    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] };
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tweetBody)
    });

    const data = await response.json();
    
    return {
      success: data.data?.id ? true : false,
      postId: data.data?.id,
      error: data.errors?.[0]?.message
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== INSTAGRAM ===============

export const postToInstagram = async (accountId, accessToken, imageUrl, caption) => {
  try {
    // Step 1: Create media container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      })
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      throw new Error(containerData.error.message);
    }

    // Step 2: Publish media
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken
      })
    });

    const publishData = await publishResponse.json();

    return {
      success: !publishData.error,
      postId: publishData.id,
      error: publishData.error?.message
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== YOUTUBE ===============

export const connectYouTube = () => {
  const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID || 'placeholder';
  const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline`;
  
  window.location.href = authUrl;
};

export const handleYouTubeCallback = async (code, userId) => {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        client_id: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
        client_secret: import.meta.env.VITE_YOUTUBE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get channel info
    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const channelData = await channelResponse.json();

    await addDoc(collection(db, 'socialAccounts'), {
      userId: userId,
      platform: 'youtube',
      accountId: channelData.items[0].id,
      accountName: channelData.items[0].snippet.title,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      connectedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('YouTube auth error:', error);
    return { success: false, error: error.message };
  }
};

export const postToYouTube = async (accessToken, videoUrl, title, description) => {
  try {
    // YouTube requires video upload via resumable upload protocol
    // This is simplified - actual implementation needs chunked upload
    
    const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          title: title,
          description: description,
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: 'public' // or 'private', 'unlisted'
        }
      })
    });

    const data = await response.json();

    return {
      success: data.id ? true : false,
      postId: data.id,
      error: data.error?.message
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============== COMMON FUNCTIONS ===============

// Get user's connected accounts
export const getConnectedAccounts = async (userId) => {
  try {
    const q = query(
      collection(db, 'socialAccounts'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const accounts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, accounts };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return { success: false, error: error.message };
  }
};

// Disconnect account
export const disconnectAccount = async (accountId) => {
  try {
    await deleteDoc(doc(db, 'socialAccounts', accountId));
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return { success: false, error: error.message };
  }
};

// Post to multiple platforms
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

    results.push({
      platform: account.platform,
      accountName: account.accountName,
      ...result
    });
  }

  return results;
};