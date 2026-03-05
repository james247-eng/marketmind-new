/**
 * Firebase Cloud Functions for Market Mind
 *
 * SPARK PLAN RULES — functions in this file must NEVER make outbound HTTP
 * requests to external APIs (Gemini, Facebook, Twitter, etc.).
 * Any function that needs to call an external API lives in Netlify Functions instead:
 *
 *   OAuth token exchange  →  netlify/functions/oauth-exchange.js
 *   AI content generation →  netlify/functions/generate-content.js
 *   AI market research    →  netlify/functions/conduct-research.js
 *   Post to Facebook      →  netlify/functions/post-to-facebook.js
 *
 * What IS allowed here on Spark:
 *   - Reading / writing Firestore
 *   - Auth checks
 *   - Returning config values stored in Firebase environment variables
 *
 * Deploy with: firebase deploy --only functions
 * Install deps: cd functions && npm install firebase-admin firebase-functions
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ==================== SUBSCRIPTION TIERS =====================================

const TIERS = {
  free: {
    monthlyPostLimit:      5,
    monthlyResearchLimit:  0,
    maxSocialConnections:  1,
    maxFileSize:           5,   // MB
    features: ['basic-content'],
  },
  pro: {
    monthlyPostLimit:      100,
    monthlyResearchLimit:  50,
    maxSocialConnections:  5,
    maxFileSize:           50,
    features: ['advanced-content', 'multi-business', 'scheduling', 'youtube'],
  },
  enterprise: {
    monthlyPostLimit:      'unlimited',
    monthlyResearchLimit:  'unlimited',
    maxSocialConnections:  'unlimited',
    maxFileSize:           100,
    features: ['all', 'priority-support', 'custom-integrations'],
  },
};

// ==================== HELPERS ================================================

async function getUserSubscription(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) throw new Error('User not found');

  const userData = userDoc.data();
  return {
    tier:   userData.subscriptionTier   || 'free',
    since:  userData.subscriptionSince  || userData.createdAt,
    status: userData.subscriptionStatus || 'active',
  };
}

async function checkMonthlyLimit(userId, type) {
  const subscription = await getUserSubscription(userId);
  const tier = TIERS[subscription.tier];

  if (type === 'post'     && tier.monthlyPostLimit     === 'unlimited') return true;
  if (type === 'research' && tier.monthlyResearchLimit === 'unlimited') return true;

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usageRef = db.collection('usage').doc(userId);
  const usageDoc = await usageRef.get();

  if (!usageDoc.exists) {
    await usageRef.set({ postsThisMonth: 0, researchThisMonth: 0, monthStart });
    return true;
  }

  const usage = usageDoc.data();

  // Reset counters if we've rolled into a new month
  if (usage.monthStart.toDate() < monthStart) {
    await usageRef.update({ postsThisMonth: 0, researchThisMonth: 0, monthStart });
    return true;
  }

  const limit        = type === 'post' ? tier.monthlyPostLimit : tier.monthlyResearchLimit;
  const currentUsage = type === 'post' ? usage.postsThisMonth  : usage.researchThisMonth;
  return currentUsage < limit;
}

async function incrementUsage(userId, type) {
  const usageRef = db.collection('usage').doc(userId);
  const field    = type === 'post' ? 'postsThisMonth' : 'researchThisMonth';
  await usageRef.update({ [field]: admin.firestore.FieldValue.increment(1) });
}

// ==================== CLOUD FUNCTIONS ========================================

/**
 * checkUsageLimit
 * Called by the frontend BEFORE hitting the Netlify AI functions.
 * Returns whether the user is allowed to generate, and their current usage.
 * Pure Firestore — safe on Spark plan.
 */
exports.checkUsageLimit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId     = context.auth.uid;
  const { type }   = data; // 'post' | 'research'

  const subscription = await getUserSubscription(userId);
  const tier         = TIERS[subscription.tier];
  const canProceed   = await checkMonthlyLimit(userId, type);

  // Fetch current counters for display in the UI
  const usageDoc  = await db.collection('usage').doc(userId).get();
  const usage     = usageDoc.exists ? usageDoc.data() : { postsThisMonth: 0, researchThisMonth: 0 };

  return {
    allowed:      canProceed,
    tier:         subscription.tier,
    used:         type === 'post' ? usage.postsThisMonth : usage.researchThisMonth,
    limit:        type === 'post' ? tier.monthlyPostLimit : tier.monthlyResearchLimit,
    upgradeMessage: !canProceed
      ? (type === 'post'
          ? 'You have reached your monthly post limit. Upgrade to Pro for 100/month.'
          : 'Research is not available on the Free plan. Upgrade to Pro.')
      : null,
  };
});

/**
 * recordContentGeneration
 * Called by the frontend AFTER a successful Netlify AI response.
 * Increments the usage counter and saves the result to Firestore history.
 * Pure Firestore — safe on Spark plan.
 */
exports.recordContentGeneration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { prompt, tone, businessContext, content } = data;

  await incrementUsage(userId, 'post');

  await db.collection('content').add({
    userId,
    prompt,
    tone,
    businessContext,
    content,
    createdAt: admin.firestore.Timestamp.now(),
    type: 'generated',
  });

  return { success: true };
});

/**
 * recordResearch
 * Called by the frontend AFTER a successful Netlify research response.
 * Increments the usage counter and saves insights to Firestore history.
 * Pure Firestore — safe on Spark plan.
 */
exports.recordResearch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { topic, businessNiche, insights } = data;

  await incrementUsage(userId, 'research');

  await db.collection('content').add({
    userId,
    topic,
    businessNiche,
    research: insights,
    createdAt: admin.firestore.Timestamp.now(),
    type: 'research',
  });

  return { success: true };
});

/**
 * generateUploadUrl
 * Returns Cloudinary upload config — no outbound HTTP, just env vars.
 * Safe on Spark plan.
 */
exports.generateUploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;

  try {
    // Validates the user exists and has an active subscription
    await getUserSubscription(userId);

    return {
      success:            true,
      cloudinaryCloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
      uploadPreset:        process.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      uploadConfig: {
        folder: `marketmind/users/${userId}/content`,
        tags:   [`user:${userId}`, 'marketplace'],
        eager:  'w_400,h_300,c_pad|w_800,h_600,c_pad',
      },
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================== REMOVED FUNCTIONS ======================================
// The following functions have been removed because they make outbound HTTP
// requests which are blocked on the Firebase Spark (free) plan:
//
//   exchangeFacebookToken  →  replaced by netlify/functions/oauth-exchange.js
//   postToFacebook         →  replaced by netlify/functions/post-to-facebook.js
//   generateContent        →  replaced by netlify/functions/generate-content.js
//   conductResearch        →  replaced by netlify/functions/conduct-research.js