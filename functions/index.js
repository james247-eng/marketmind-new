/**
 * Firebase Cloud Functions for Market Mind
 * 
 * These functions run on Google servers, keeping API keys secure.
 * Deploy with: firebase deploy --only functions
 * 
 * Install dependencies first:
 * cd functions
 * npm install firebase-admin firebase-functions axios
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// ==================== SUBSCRIPTION TIERS ====================
// FREE tier: 5 posts/month, 1 social media link only, no research
const TIERS = {
  free: {
    monthlyPostLimit: 5,
    monthlyResearchLimit: 0,
    maxSocialConnections: 1, // Only 1 social platform allowed
    maxFileSize: 5, // MB
    features: ['basic-content']
  },
  pro: {
    monthlyPostLimit: 100,
    monthlyResearchLimit: 50,
    maxSocialConnections: 5,
    maxFileSize: 50,
    features: ['advanced-content', 'multi-business', 'scheduling', 'youtube']
  },
  enterprise: {
    monthlyPostLimit: 'unlimited',
    monthlyResearchLimit: 'unlimited',
    maxSocialConnections: 'unlimited',
    maxFileSize: 100,
    features: ['all', 'priority-support', 'custom-integrations']
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get user's current subscription info
 */
async function getUserSubscription(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) throw new Error('User not found');
  
  const userData = userDoc.data();
  return {
    tier: userData.subscriptionTier || 'free',
    since: userData.subscriptionSince || userData.createdAt,
    status: userData.subscriptionStatus || 'active'
  };
}

/**
 * Check if user has exceeded monthly limit
 */
async function checkMonthlyLimit(userId, type) {
  const subscription = await getUserSubscription(userId);
  const tier = TIERS[subscription.tier];
  
  if (type === 'post' && tier.monthlyPostLimit === 'unlimited') return true;
  if (type === 'research' && tier.monthlyResearchLimit === 'unlimited') return true;
  
  // Get current month usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const usageRef = db.collection('usage').doc(userId);
  const usageDoc = await usageRef.get();
  
  if (!usageDoc.exists) {
    await usageRef.set({
      postsThisMonth: 0,
      researchThisMonth: 0,
      monthStart: monthStart
    });
    return true;
  }
  
  const usage = usageDoc.data();
  const limit = type === 'post' ? tier.monthlyPostLimit : tier.monthlyResearchLimit;
  
  if (usage.monthStart < monthStart) {
    // New month, reset counters
    await usageRef.update({
      postsThisMonth: 0,
      researchThisMonth: 0,
      monthStart: monthStart
    });
    return true;
  }
  
  const currentUsage = type === 'post' ? usage.postsThisMonth : usage.researchThisMonth;
  return currentUsage < limit;
}

/**
 * Increment usage counter
 */
async function incrementUsage(userId, type) {
  const usageRef = db.collection('usage').doc(userId);
  if (type === 'post') {
    await usageRef.update({ postsThisMonth: admin.firestore.FieldValue.increment(1) });
  } else if (type === 'research') {
    await usageRef.update({ researchThisMonth: admin.firestore.FieldValue.increment(1) });
  }
}

// ==================== CLOUD FUNCTIONS ====================

/**
 * Generate marketing content using Google Gemini API (FREE)
 * Called from: ContentGenerator.jsx
 */
exports.generateContent = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { prompt, tone, businessContext } = data;

  try {
    // Check monthly limit
    const canGenerate = await checkMonthlyLimit(userId, 'post');
    if (!canGenerate) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'You have reached your monthly post generation limit (5 posts). Upgrade to Pro for 100/month.'
      );
    }

    // Call Google Gemini API (FREE, 60 calls/min)
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a professional marketing copywriter specializing in ${businessContext}.

Generate compelling social media content with the following requirements:
- Tone: ${tone}
- Task: ${prompt}

Create posts optimized for:
1. Twitter/X (280 characters with relevant hashtags)
2. LinkedIn (professional version, slightly longer)
3. Instagram (engaging, with emojis and hashtags)
4. TikTok (trendy, casual tone)
5. YouTube (title and description, engaging hook)

Format as JSON with keys: twitter, linkedin, instagram, tiktok, youtube.`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7
        }
      }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content generated');

    // Increment usage
    await incrementUsage(userId, 'post');

    // Save to Firestore for history
    await db.collection('content').add({
      userId,
      prompt,
      tone,
      businessContext,
      content,
      createdAt: admin.firestore.Timestamp.now(),
      type: 'generated'
    });

    return {
      success: true,
      content
    };
  } catch (error) {
    console.error('Content generation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Conduct market research using Google Gemini API (FREE, replaces Perplexity)
 */
exports.conductResearch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { topic, businessNiche } = data;

  try {
    // Check monthly limit
    const canResearch = await checkMonthlyLimit(userId, 'research');
    if (!canResearch) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Research not available on Free plan. Upgrade to Pro for market insights.'
      );
    }

    // Call Google Gemini API (FREE)
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Research current trends and insights about: "${topic}" in the ${businessNiche} industry. 
        
Provide:
1. Top 5 current trends
2. Key statistics and data
3. Emerging opportunities
4. Recommended content angles
5. Competitor insights

Format as JSON for easy parsing.`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7
        }
      }
    );

    const insights = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!insights) throw new Error('No insights generated');

    // Increment usage
    await incrementUsage(userId, 'research');

    // Save research
    await db.collection('content').add({
      userId,
      topic,
      businessNiche,
      research: insights,
      createdAt: admin.firestore.Timestamp.now(),
      type: 'research'
    });

    return {
      success: true,
      insights
    };
  } catch (error) {
    console.error('Research error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Generate signed URL for R2 uploads
 */
exports.generateUploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { fileName, fileType } = data;

  try {
    // Validate file
    const subscription = await getUserSubscription(userId);
    const tier = TIERS[subscription.tier];
    
    // For Cloudinary, we use unsigned uploads with preset
    // No need for signed URL - client uploads directly to Cloudinary
    
    return {
      success: true,
      cloudinaryCloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      uploadConfig: {
        folder: `marketmind/users/${userId}/content`,
        tags: [`user:${userId}`, 'marketplace'],
        eager: 'w_400,h_300,c_pad|w_800,h_600,c_pad' // Create thumbnails
      }
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Exchange Facebook OAuth code for access token (SECURE - backend only)
 */
exports.exchangeFacebookToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { code, redirectUri } = data;

  try {
    // Secret key only on backend - NEVER in frontend
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: redirectUri,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        code
      }
    );

    const { access_token } = response.data;
    if (!access_token) throw new Error('No access token received');

    // Get user's pages
    const pagesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );

    return {
      success: true,
      pages: pagesResponse.data.data
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Post to Facebook (SECURE - backend only)
 */
exports.postToFacebook = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { pageId, accessToken, content, imageUrl } = data;

  try {
    const body = {
      message: content,
      access_token: accessToken
    };

    if (imageUrl) {
      body.link = imageUrl;
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      body
    );

    return {
      success: !response.data.error,
      postId: response.data.id,
      error: response.data.error?.message || null
    };
  } catch (error) {
    console.error('Post error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
