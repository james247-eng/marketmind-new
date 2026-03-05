// netlify/functions/initialize-payment.js
// Initializes a Paystack payment session and returns the authorization URL.
// The PAYSTACK_SECRET_KEY lives only in Netlify env vars — never in the browser.
//
// Request body: { email, plan, billing }
// Response:     { success, authorizationUrl, reference }

const https = require('https');

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

// ─── Plan amounts (kobo — Paystack uses smallest currency unit) ───────────────

const PLAN_AMOUNTS = {
  pro: {
    monthly: 999900,   // ₦9,999
    yearly:  9999900,  // ₦99,999
  },
  enterprise: {
    monthly: 2999900,  // ₦29,999
    yearly:  29999900, // ₦299,999
  },
};

// ─── Paystack API helper ──────────────────────────────────────────────────────

const paystackRequest = (path, body) => new Promise((resolve, reject) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return reject(new Error('Missing PAYSTACK_SECRET_KEY environment variable'));

  const bodyStr = JSON.stringify(body);

  const req = https.request({
    hostname: 'api.paystack.co',
    path,
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
    },
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error('Failed to parse Paystack response')); }
    });
  });

  req.on('error', reject);
  req.write(bodyStr);
  req.end();
});

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, plan, billing = 'monthly' } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Missing required field: email' }),
      };
    }

    if (!plan || !PLAN_AMOUNTS[plan]) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: `Invalid plan: ${plan}. Must be "pro" or "enterprise"` }),
      };
    }

    const amount    = PLAN_AMOUNTS[plan][billing] || PLAN_AMOUNTS[plan].monthly;
    const reference = `MM-${plan}-${billing}-${Date.now()}`;

    const result = await paystackRequest('/transaction/initialize', {
      email,
      amount,
      reference,
      currency:     'NGN',
      callback_url: `${process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app'}/payment/verify`,
      metadata: {
        plan,
        billing,
        custom_fields: [
          { display_name: 'Plan',    variable_name: 'plan',    value: plan    },
          { display_name: 'Billing', variable_name: 'billing', value: billing },
        ],
      },
    });

    if (!result.status) {
      throw new Error(result.message || 'Paystack initialization failed');
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        success:          true,
        authorizationUrl: result.data.authorization_url,
        reference:        result.data.reference,
      }),
    };

  } catch (error) {
    console.error('initialize-payment error:', error.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};