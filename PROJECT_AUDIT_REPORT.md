# 🚨 CRITICAL PROJECT AUDIT REPORT

**Date:** December 28, 2025  
**Project:** Market Mind - Social Media Content Generator SaaS  
**Status:** ⚠️ MULTIPLE CRITICAL BLOCKING ISSUES FOUND

---

## 📋 EXECUTIVE SUMMARY

Your app has **functional architecture** but faces **5 critical blocking issues** that will prevent production launch:

1. **🔴 EXPOSED API KEYS IN NETLIFY.TOML** - YouTube secrets publicly visible
2. **🔴 INCOMPLETE OAUTH IMPLEMENTATIONS** - Missing backend functions
3. **🔴 MISSING ENVIRONMENT VARIABLES** - Frontend will crash without them
4. **🔴 SECURITY VULNERABILITIES** - Secret keys in wrong places
5. **🔴 BROKEN DEPENDENCIES** - OAuth handlers not deployed

---

## 🛑 CRITICAL BLOCKING ISSUES (FIX THESE FIRST)

### Issue #1: EXPOSED SECRETS IN NETLIFY.TOML (IMMEDIATE ACTION REQUIRED)

**Severity:** 🔴 CRITICAL - Credentials compromised in source code

**Location:** [netlify.toml](netlify.toml#L1-L3)

```plaintext
youtube api key: AIzaSyAv-WGy8mkpb-qLpEh5zFzIHhanHlhwKdA
youtube client id: 897332196564-aauq3khml8cpjmk44048n6vtklcmhqcr.apps.googleusercontent.com
youtube client secret: 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
```

**Problem:**

- YouTube API key and secret are **visible in your source code**
- This file is likely in version control and publicly accessible
- Anyone with this key can make requests as you (quota theft, malicious use)
- YouTube secret should NEVER be exposed

**Action Required (DO THIS NOW):**

1. **Revoke these credentials immediately:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Delete the exposed API key and secret
   - Generate new credentials
2. **Remove from netlify.toml:**
   - Delete lines 1-3 (the exposed keys)
   - These should never be in source code
3. **Store properly:**
   - Put only client ID in: `.env.local` as `VITE_YOUTUBE_CLIENT_ID`
   - Put secret in Netlify Functions env: `YOUTUBE_CLIENT_SECRET`

**Impact if not fixed:** Your YouTube credentials are actively compromised right now.

---

### Issue #2: INCOMPLETE OAUTH IMPLEMENTATION - Missing Backend Functions

**Severity:** 🔴 CRITICAL - App will crash when users try to connect social accounts

**Problem:**
Your frontend calls backend functions that don't exist or aren't deployed:

1. **[socialMediaService.js](src/services/socialMediaService.js#L27-L28)** calls:

   ```javascript
   const exchangeToken = httpsCallable(functions, "exchangeFacebookToken");
   ```

   - ✅ Function called but **NOT defined** in `functions/index.js`

2. **[socialAuthService.js](src/services/socialAuthService.js#L121-L130)** calls:

   ```javascript
   const response = await fetch(`${BACKEND_URL}/oauth-exchange`, {...})
   ```

   - Uses Netlify Functions endpoint: `/.netlify/functions/oauth-exchange`
   - ✅ Function exists at [netlify/functions/oauth-exchange.js](netlify/functions/oauth-exchange.js)
   - ❌ **But it's incomplete** - has pseudo-code, missing error handling

3. **[aiService.js](src/services/aiService.js#L12)** calls:
   ```javascript
   const generateContentFunction = httpsCallable(functions, "generateContent");
   ```
   - ✅ Defined in `functions/index.js` line 125
   - ❌ **Depends on GEMINI_API_KEY** which is a free Google API

**Which functions are missing:**

| Function                | Called From           | Status        | Fix                       |
| ----------------------- | --------------------- | ------------- | ------------------------- |
| `exchangeFacebookToken` | socialMediaService.js | ❌ Missing    | Add to functions/index.js |
| `postToFacebook`        | socialMediaService.js | ❌ Missing    | Add to functions/index.js |
| `oauth-exchange`        | socialAuthService.js  | ⚠️ Incomplete | Deploy Netlify function   |
| `generateContent`       | ContentGenerator.jsx  | ✅ Exists     | Needs GEMINI_API_KEY      |
| `conductResearch`       | ContentGenerator.jsx  | ✅ Exists     | Needs GEMINI_API_KEY      |
| `initializePayment`     | Pricing.jsx           | ❌ Missing    | Add to functions/index.js |

**When it breaks:**

- User clicks "Connect Instagram" → App crashes (no `exchangeFacebookToken`)
- User tries to generate content → Fails (GEMINI_API_KEY not set)
- User tries to pay → Fails (no `initializePayment`)

**Action Required:**

1. Deploy Cloud Functions: `cd functions && firebase deploy --only functions`
2. Deploy Netlify Functions (auto-deployed with Netlify)
3. Add missing functions to `functions/index.js`

---

### Issue #3: MISSING ENVIRONMENT VARIABLES - Frontend Will Crash

**Severity:** 🔴 CRITICAL - App won't load without these

**Where to add them:**

#### A) Local Development (.env.local)

Create this file in project root:

```
VITE_FIREBASE_API_KEY=your-value
VITE_FIREBASE_AUTH_DOMAIN=your-value
VITE_FIREBASE_PROJECT_ID=your-value
VITE_FIREBASE_STORAGE_BUCKET=your-value
VITE_FIREBASE_MESSAGING_SENDER_ID=your-value
VITE_FIREBASE_APP_ID=your-value
VITE_FACEBOOK_APP_ID=your-value
VITE_TIKTOK_CLIENT_KEY=your-value
VITE_YOUTUBE_CLIENT_ID=your-value
VITE_TWITTER_API_KEY=your-value
VITE_INSTAGRAM_APP_ID=your-value
```

#### B) Netlify Environment Variables

Go to: **Netlify Dashboard → Site Settings → Build & Deploy → Environment**

Add ONLY these (no secrets):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FACEBOOK_APP_ID
VITE_TIKTOK_CLIENT_KEY
VITE_YOUTUBE_CLIENT_ID
VITE_TWITTER_API_KEY
VITE_INSTAGRAM_APP_ID
```

#### C) Netlify Function Environment Variables (BACKEND)

Netlify auto-picks these from your site environment, but you need to set them:

Go to: **Netlify Dashboard → Build & Deploy → Environment**

Add these (these are SECRETS - only backend can see):

```
YOUTUBE_CLIENT_SECRET=your-youtube-secret
FACEBOOK_APP_SECRET=your-facebook-secret
FACEBOOK_CLIENT_ID=your-facebook-id
FACEBOOK_CLIENT_SECRET=your-facebook-secret
TIKTOK_CLIENT_ID=your-tiktok-id
TIKTOK_CLIENT_SECRET=your-tiktok-secret
TWITTER_API_KEY=your-twitter-key
TWITTER_API_SECRET=your-twitter-secret
TWITTER_BEARER_TOKEN=your-bearer-token
GEMINI_API_KEY=your-gemini-key
PAYSTACK_SECRET_KEY=sk_live_xxxxx
```

**Important:** Do NOT use `VITE_` prefix for secrets - they'll be exposed in the frontend!

---

### Issue #4: SECURITY VULNERABILITIES IN CODE

**Severity:** 🔴 CRITICAL

#### A) Access Tokens Stored Unencrypted

**Location:** [socialAuthService.js](src/services/socialAuthService.js#L157-L158)

```javascript
accessToken: tokenData.accessToken || '', // Should be encrypted!
refreshToken: tokenData.refreshToken || '',
```

**Problem:** Access tokens are stored as plain text in Firestore. If database is compromised, all social media accounts are exposed.

**Fix:** Encrypt tokens before storing. Add to functions/index.js:

```javascript
const crypto = require("crypto");

function encryptToken(token) {
  const cipher = crypto.createCipher("aes-256-cbc", process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}
```

#### B) OAuth Secret in Frontend Code

**Location:** [socialMediaService.js](src/services/socialMediaService.js#L93-L98)

```javascript
export const handleTikTokCallback = async (code, userId) => {
  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    body: new URLSearchParams({
      client_key: import.meta.env.VITE_TIKTOK_CLIENT_KEY,
      client_secret: import.meta.env.VITE_TIKTOK_CLIENT_SECRET,  // ❌ EXPOSED!
```

**Problem:** `VITE_TIKTOK_CLIENT_SECRET` uses `VITE_` prefix = it's compiled into frontend JavaScript. Anyone can read it from the bundle.

**Fix:** Move this call to backend (`functions/index.js`). Use `httpsCallable` instead of fetch.

#### C) Missing CSRF Token Validation

**Location:** [OAuthCallback.jsx](src/components/OAuthCallback.jsx#L25)

```javascript
const state = searchParams.get("state");
// State validation happens in socialAuthService but only logged to console
```

**Problem:** State is validated but error is silently swallowed. No user feedback if attack is detected.

**Fix:** Throw explicit error if state validation fails.

---

### Issue #5: CONFIGURATION INCONSISTENCIES

**Severity:** 🟡 HIGH

#### App URL Mismatch

**Frontend expects:** `https://marketmind-02.netlify.app`  
([socialAuthService.js](src/services/socialAuthService.js#L8-L9))

**Issue:** If you redeploy to a different Netlify URL, OAuth callbacks will fail.

**Fix:** Use environment variable:

```javascript
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
```

#### OAuth Redirect URIs Not Registered

For each platform (Facebook, TikTok, YouTube, Twitter), you need to register callback URLs in their developer consoles:

- Facebook: `https://your-domain.netlify.app/auth/facebook/callback`
- TikTok: `https://your-domain.netlify.app/auth/tiktok/callback`
- YouTube: `https://your-domain.netlify.app/auth/youtube/callback`
- Twitter: `https://your-domain.netlify.app/auth/twitter/callback`

If these aren't registered, OAuth will fail at the provider level.

---

## 📍 WHERE TO PUT YOUR API KEYS & IDS

### Frontend Safe (These go in .env.local and Netlify with VITE\_ prefix):

| Service       | Variable Name                     | Value                             | Where                                                                                    |
| ------------- | --------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| **Firebase**  | VITE_FIREBASE_API_KEY             | abc123...                         | [Firebase Console](https://firebase.google.com) → Settings → Web SDK                     |
| **Firebase**  | VITE_FIREBASE_PROJECT_ID          | my-project-id                     | Firebase Console                                                                         |
| **Firebase**  | VITE_FIREBASE_AUTH_DOMAIN         | my-project.firebaseapp.com        | Firebase Console                                                                         |
| **Firebase**  | VITE_FIREBASE_STORAGE_BUCKET      | my-project.appspot.com            | Firebase Console                                                                         |
| **Firebase**  | VITE_FIREBASE_MESSAGING_SENDER_ID | 123456789                         | Firebase Console                                                                         |
| **Firebase**  | VITE_FIREBASE_APP_ID              | 1:123456:web:abc123               | Firebase Console                                                                         |
| **Facebook**  | VITE_FACEBOOK_APP_ID              | 123456789                         | [Facebook Developers](https://developers.facebook.com) → My Apps → App ID                |
| **Instagram** | VITE_INSTAGRAM_APP_ID             | 123456789                         | Same as Facebook (same app ID)                                                           |
| **YouTube**   | VITE_YOUTUBE_CLIENT_ID            | 123456.apps.googleusercontent.com | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| **TikTok**    | VITE_TIKTOK_CLIENT_KEY            | abc123def456                      | [TikTok Developers](https://developers.tiktok.com) → My Apps → Client Key                |
| **Twitter**   | VITE_TWITTER_API_KEY              | Abc123XyZ                         | [Twitter Developer Portal](https://developer.twitter.com/en/portal) → API Keys           |
| **Paystack**  | VITE_PAYSTACK_PUBLIC_KEY          | pk_live_abc123...                 | [Paystack Dashboard](https://dashboard.paystack.com) → Settings → API Keys & Webhooks    |

### Backend Only (NO VITE\_ prefix - Netlify Functions env vars):

| Service      | Variable Name         | Where                                                        |
| ------------ | --------------------- | ------------------------------------------------------------ |
| **Gemini**   | GEMINI_API_KEY        | [Google AI Studio](https://aistudio.google.com/app/apikey)   |
| **Facebook** | FACEBOOK_APP_SECRET   | Facebook Developers → My Apps → Settings → Basic             |
| **Facebook** | FACEBOOK_CLIENT_ID    | Same as above                                                |
| **YouTube**  | YOUTUBE_CLIENT_SECRET | Google Cloud Console → APIs & Services → Credentials         |
| **TikTok**   | TIKTOK_CLIENT_SECRET  | TikTok Developers → My Apps → Client Secret                  |
| **Twitter**  | TWITTER_API_SECRET    | Twitter Developer Portal → API Keys → API Secret Key         |
| **Twitter**  | TWITTER_BEARER_TOKEN  | Twitter Developer Portal → Bearer Token                      |
| **Paystack** | PAYSTACK_SECRET_KEY   | Paystack Dashboard → Settings → API Keys → Secret Key (live) |

### Never in Source Code:

- ❌ API Keys with credentials
- ❌ OAuth Secrets
- ❌ Database passwords
- ❌ Signing keys

---

## 🔒 SECURITY RISK ASSESSMENT

### Critical Risks (Must Fix Before Launch)

| Risk                                        | Current State | Impact                                     | Fix                               |
| ------------------------------------------- | ------------- | ------------------------------------------ | --------------------------------- |
| Exposed YouTube credentials in netlify.toml | 🔴 Active     | Credentials compromised                    | Revoke and regenerate immediately |
| OAuth secrets in frontend code              | 🔴 Active     | All social logins compromised              | Move to backend only              |
| Access tokens unencrypted                   | 🔴 Active     | Entire user base's social accounts at risk | Add encryption                    |
| Missing CORS validation                     | 🔴 Active     | Cross-site attacks possible                | Add strict CORS headers           |
| No rate limiting on OAuth                   | 🔴 Active     | Brute force attacks possible               | Add rate limiting to backend      |

### High Risks (Should Fix Soon)

| Risk                                          | Current State | Impact                              | Fix                          |
| --------------------------------------------- | ------------- | ----------------------------------- | ---------------------------- |
| Access tokens stored in Firestore unencrypted | 🟠 Likely     | Database breach = data theft        | Encrypt before storing       |
| No token expiration handling                  | 🟠 Likely     | Old tokens = continued access       | Refresh tokens automatically |
| Firestore rules not visible                   | 🟠 Unknown    | Database could be publicly readable | Check firestore.rules        |
| Cloud Functions authorization                 | 🟠 Unknown    | Anyone could call functions         | Add `context.auth` checks    |
| No input validation                           | 🟠 Likely     | Injection attacks possible          | Validate all user inputs     |

---

## 🚀 WHAT WILL STOP THE APP FROM RUNNING

### On Local Dev (npm run dev):

1. ❌ **Missing .env.local** - Vite will crash with undefined env vars
2. ❌ **Exposed YouTube keys in netlify.toml** - Won't affect dev, but critical for production
3. ⚠️ **GEMINI_API_KEY not set** - Content generation will fail at runtime

### On Netlify Deploy:

1. ❌ **Missing environment variables** - Build may pass but runtime errors
2. ❌ **Firebase functions not deployed** - OAuth, content generation, payments will fail
3. ❌ **OAuth secrets missing** - Token exchange will fail
4. ❌ **Missing Netlify Functions** - OAuth callback fails with 404

### When User Tries to Use App:

1. **Sign up/Login** - ✅ Works (Firebase Auth is set up)
2. **Dashboard** - ✅ Loads
3. **Connect Social Media** - ❌ Crashes (no backend function)
4. **Generate Content** - ❌ Fails (GEMINI_API_KEY missing)
5. **Buy Premium** - ❌ Fails (no payment function)

---

## ✅ DEPLOYMENT CHECKLIST

### Step 1: Fix Exposed Credentials (DO THIS NOW)

- [ ] Revoke YouTube API key and secret in Google Cloud Console
- [ ] Delete lines 1-3 from netlify.toml
- [ ] Generate new YouTube credentials
- [ ] Add to .env.local and Netlify

### Step 2: Prepare Environment Variables

- [ ] Create .env.local with all VITE\_ variables
- [ ] Create Netlify environment variables (VITE\_ ones)
- [ ] Create Netlify Functions environment variables (backend ones)
- [ ] Do NOT commit .env.local to Git

### Step 3: Deploy Backend

- [ ] Run: `cd functions && firebase deploy --only functions`
- [ ] Verify functions deployed: `firebase functions:list`
- [ ] Check Cloud Functions logs for errors

### Step 4: Deploy Frontend

- [ ] Run: `npm run build`
- [ ] Verify build succeeds
- [ ] Push to GitHub
- [ ] Netlify auto-deploys

### Step 5: Register OAuth Callbacks

- [ ] Facebook: Add callback URL in Settings → Basic → OAuth Redirect URIs
- [ ] TikTok: Add in Dev Tools → Endpoints
- [ ] YouTube: Add in Google Cloud → Authorized redirect URIs
- [ ] Twitter: Add in App Settings → OAuth 2.0 Settings

### Step 6: Test

- [ ] Test sign up: Create account
- [ ] Test sign in: Log in with email
- [ ] Test Google login: Try Google sign-in
- [ ] Test content generation: Try generating a post
- [ ] Test social connection: Try connecting one platform
- [ ] Test payment: Try starting a purchase (test mode)

---

## 📊 ARCHITECTURE ASSESSMENT

### ✅ What's Working Well:

- Firebase Auth setup is correct
- Vite config is clean
- React Router structure is solid
- Component organization is good
- Subscription tiers logic is implemented
- Protected routes are set up
- Error boundaries exist
- CSRF protection in OAuth (state validation)

### ⚠️ What Needs Attention:

- OAuth flow split between frontend and backend inconsistently
- Token storage not encrypted
- No request validation middleware
- Firestore security rules not visible
- No logging/monitoring setup
- Error messages could leak information
- No rate limiting implemented
- Missing API version management

### 🎯 Next Steps (After Fixing Critical Issues):

1. Add end-to-end encryption for sensitive data
2. Implement comprehensive logging
3. Add API rate limiting
4. Set up monitoring and alerts
5. Create backup/recovery procedures
6. Add comprehensive input validation
7. Implement request signing
8. Add automated security scanning in CI/CD

---

## 🔗 QUICK REFERENCE - WHERE TO ADD KEYS

### For Facebook App ID:

In code: [src/services/socialMediaService.js](src/services/socialMediaService.js#L16)

```javascript
const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || "placeholder";
```

### For TikTok Client Key:

In code: [src/services/socialMediaService.js](src/services/socialMediaService.js#L77)

```javascript
const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || "placeholder";
```

### For YouTube Client ID:

In code: [src/services/socialMediaService.js](src/services/socialMediaService.js#L220)

```javascript
const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID || "placeholder";
```

### For Gemini API (Backend):

In code: [functions/index.js](functions/index.js#L163)

```javascript
const response = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  ...
)
```

---

**Generated:** December 28, 2025  
**Action Required:** Address Critical Issues immediately before launch
