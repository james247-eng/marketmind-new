/**
 * Firebase Cloud Functions for Market Mind
 * 
 * These functions run on Google servers, keeping API keys secure.
 * Deploy with: firebase deploy --only functions
 * 
 * Install dependencies first:
 * cd functions
 * npm install firebase-admin firebase-functions @anthropic-ai/sdk axios
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// Initialize Anthropic (Claude)
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// ==================== SUBSCRIPTION TIERS ====================
const TIERS = {
  free: {
    monthlyPostLimit: 10,
    monthlyResearchLimit: 5,
    maxFileSize: 5, // MB
    features: ['basic-content', 'single-business']
  },
  pro: {
    monthlyPostLimit: 100,
    monthlyResearchLimit: 50,
    maxFileSize: 50,
    features: ['advanced-content', 'multi-business', 'scheduling', 'youtube']
  },
  enterprise: {
    monthlyPostLimit: 'unlimited',
    monthlyResearchLimit: 'unlimited',
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
 * Generate marketing content using Claude AI
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
        'You have reached your monthly post generation limit. Upgrade to Pro or Enterprise.'
      );
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a professional marketing copywriter specializing in ${businessContext}.

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
    });

    // Increment usage
    await incrementUsage(userId, 'post');

    // Save to Firestore for history
    await db.collection('content').add({
      userId,
      prompt,
      tone,
      businessContext,
      content: response.content[0].text,
      createdAt: admin.firestore.Timestamp.now(),
      type: 'generated'
    });

    return {
      success: true,
      content: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens
    };
  } catch (error) {
    console.error('Content generation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Conduct market research using Perplexity API
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
        'You have reached your monthly research limit. Upgrade your plan.'
      );
    }

    // Call Perplexity API
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{
        role: 'user',
        content: `Research current trends and insights about: "${topic}" in the ${businessNiche} industry. 
        
Provide:
1. Top 5 current trends
2. Key statistics and data
3. Emerging opportunities
4. Recommended content angles
5. Competitor insights

Format as JSON for easy parsing.`
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      }
    });

    // Increment usage
    await incrementUsage(userId, 'research');

    // Save research
    await db.collection('content').add({
      userId,
      topic,
      businessNiche,
      research: response.data.choices[0].message.content,
      createdAt: admin.firestore.Timestamp.now(),
      type: 'research'
    });

    return {
      success: true,
      insights: response.data.choices[0].message.content
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
    
    // In production, use AWS SDK to generate signed URL
    // This is a placeholder - implement with actual R2 signed URL generation
    
    const signedUrl = `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.dev/uploads/${userId}/${fileName}`;
    
    return {
      success: true,
      uploadUrl: signedUrl,
      fileType
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.TIERS = TIERS;
