/**
 * Paystack Payment Integration for Market Mind
 * 
 * Handles subscription payments and tier upgrades
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

const db = admin.firestore();

// ==================== PRICING ====================
const PRICING = {
  pro: {
    monthlyPrice: 9999, // 99.99 NGN or equivalent in user's currency
    yearlyPrice: 99999,
    plan: 'monthly'
  },
  enterprise: {
    monthlyPrice: 29999, // 299.99 NGN
    yearlyPrice: 299999,
    plan: 'monthly'
  }
};

/**
 * Initialize payment - Create Paystack transaction
 */
exports.initializePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { plan, billing } = data; // plan: 'pro' or 'enterprise', billing: 'monthly' or 'yearly'

  try {
    // Get user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new Error('User not found');
    
    const user = userDoc.data();
    const amount = billing === 'yearly' ? PRICING[plan].yearlyPrice : PRICING[plan].monthlyPrice;

    // Create Paystack transaction
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: user.email,
      amount: amount * 100, // Paystack expects amount in kobo (lowest unit)
      metadata: {
        userId,
        plan,
        billing
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.status) {
      throw new Error('Failed to initialize payment');
    }

    // Save pending subscription
    await db.collection('pendingSubscriptions').add({
      userId,
      plan,
      billing,
      paystackReference: response.data.data.reference,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });

    return {
      success: true,
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code,
      reference: response.data.data.reference
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Verify payment webhook from Paystack
 * Call this from your frontend after user completes payment
 */
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;
  const { reference } = data;

  try {
    // Verify with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    if (!response.data.status || response.data.data.status !== 'success') {
      throw new Error('Payment verification failed');
    }

    // Get pending subscription
    const pendingDocs = await db.collection('pendingSubscriptions')
      .where('paystackReference', '==', reference)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (pendingDocs.empty) {
      throw new Error('Subscription record not found');
    }

    const pendingData = pendingDocs.docs[0].data();
    const { plan, billing } = pendingData;

    // Calculate subscription end date
    const now = new Date();
    const subscriptionEnd = billing === 'yearly'
      ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    // Update user subscription
    await db.collection('users').doc(userId).update({
      subscriptionTier: plan,
      subscriptionBilling: billing,
      subscriptionStart: admin.firestore.Timestamp.now(),
      subscriptionEnd: admin.firestore.Timestamp.fromDate(subscriptionEnd),
      subscriptionStatus: 'active',
      paymentReference: reference
    });

    // Record payment
    await db.collection('payments').add({
      userId,
      plan,
      billing,
      amount: billing === 'yearly' ? PRICING[plan].yearlyPrice : PRICING[plan].monthlyPrice,
      paystackReference: reference,
      status: 'completed',
      createdAt: admin.firestore.Timestamp.now(),
      transactionId: response.data.data.id
    });

    // Delete pending subscription
    await pendingDocs.docs[0].ref.delete();

    return {
      success: true,
      message: `Welcome to ${plan.toUpperCase()} plan!`,
      tier: plan
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Handle Paystack webhook (server-to-server verification)
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const { event, data } = req.body;

    if (event === 'charge.success') {
      const reference = data.reference;
      const userId = data.metadata.userId;

      // Update subscription as verified
      await db.collection('users').doc(userId).update({
        subscriptionStatus: 'active'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check subscription status
 */
exports.checkSubscriptionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const userId = context.auth.uid;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new Error('User not found');

    const user = userDoc.data();
    const now = new Date();
    const subscriptionEnd = user.subscriptionEnd?.toDate?.();

    // Auto-downgrade if subscription expired
    if (subscriptionEnd && subscriptionEnd < now && user.subscriptionTier !== 'free') {
      await db.collection('users').doc(userId).update({
        subscriptionTier: 'free',
        subscriptionStatus: 'expired'
      });

      return {
        tier: 'free',
        status: 'expired',
        message: 'Your subscription has expired. Downgraded to Free plan.'
      };
    }

    return {
      tier: user.subscriptionTier || 'free',
      status: user.subscriptionStatus || 'inactive',
      subscriptionEnd: subscriptionEnd,
      daysRemaining: subscriptionEnd
        ? Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24))
        : null
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.PRICING = PRICING;
