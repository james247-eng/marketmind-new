const admin = require('firebase-admin');

if (!admin.apps.length) {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawServiceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawServiceAccount);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must contain valid JSON');
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

module.exports = admin;
