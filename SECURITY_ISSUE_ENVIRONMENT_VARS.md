# 🚨 SECURITY ISSUE - Environment Variables Exposure

## PROBLEM: Secret Keys Being Exposed to Frontend

**Netlify Alert is CORRECT** - You have a real security vulnerability.

---

## What's Exposed (CURRENTLY IN FRONTEND BUNDLE):

```
❌ VITE_FACEBOOK_APP_SECRET    - Should be BACKEND ONLY
❌ VITE_TIKTOK_CLIENT_SECRET   - Should be BACKEND ONLY
❌ VITE_YOUTUBE_CLIENT_SECRET  - Should be BACKEND ONLY
```

**Why this is dangerous:**

- These secrets are embedded in your compiled JavaScript
- Anyone can inspect network traffic → find your secrets
- Attackers can impersonate your app using your secret key
- Facebook/TikTok/YouTube will revoke your keys if exposed

---

## Root Cause

Your frontend code is calling OAuth token exchange directly:

**socialMediaService.js (Line 24):**

```javascript
const tokenResponse = await fetch(
  `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${
    import.meta.env.VITE_FACEBOOK_APP_ID
  }&redirect_uri=${REDIRECT_URI}&client_secret=${
    import.meta.env.VITE_FACEBOOK_APP_SECRET
  }&code=${code}`
);
```

❌ This exposes `VITE_FACEBOOK_APP_SECRET` in the network request.

---

## CORRECT NAMING CONVENTION

### ✅ Frontend-Safe (VITE\_ prefix):

```
VITE_FIREBASE_API_KEY              ✅ Safe - Firebase allows this
VITE_FIREBASE_PROJECT_ID           ✅ Safe - Public project ID
VITE_PAYSTACK_PUBLIC_KEY           ✅ Safe - Public key meant for frontend
VITE_FACEBOOK_APP_ID               ✅ Safe - Client ID only (no secret)
VITE_TIKTOK_CLIENT_KEY             ✅ Safe - Client key only
VITE_GEMINI_API_KEY                ❌ ISSUE - Should be backend only
```

### ❌ Backend-Only (NO VITE\_ prefix - Cloud Functions only):

```
FIREBASE_ADMIN_SDK_KEY             ✅ Only in Cloud Functions
PAYSTACK_SECRET_KEY                ✅ Only in Cloud Functions
FACEBOOK_APP_SECRET                ✅ Only in Cloud Functions
TIKTOK_CLIENT_SECRET               ✅ Only in Cloud Functions
YOUTUBE_CLIENT_SECRET              ✅ Only in Cloud Functions
GEMINI_API_KEY                     ✅ Only in Cloud Functions
```

---

## FIX REQUIRED

### Step 1: Remove Secret Keys from Netlify Frontend Environment

**Delete these variables from Netlify:**

- ❌ VITE_FACEBOOK_APP_SECRET
- ❌ VITE_TIKTOK_CLIENT_SECRET
- ❌ VITE_YOUTUBE_CLIENT_SECRET
- ❌ VITE*GEMINI_API_KEY (should not have VITE* prefix)

### Step 2: Move All OAuth Calls to Cloud Functions

Instead of frontend handling token exchange, create Cloud Functions:

**Create: functions/socialAuth.js**

```javascript
exports.exchangeFacebookToken = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) throw new Error("Unauthenticated");

    const { code } = data;

    try {
      const response = await axios.post(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET, // Backend only!
          redirect_uri: "https://yourdomain.com/auth/facebook/callback",
          code,
        }
      );

      return { accessToken: response.data.access_token };
    } catch (error) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);
```

### Step 3: Update Frontend to Call Cloud Function

**Instead of:**

```javascript
// ❌ WRONG - Frontend exchanges token
const tokenResponse = await fetch(
  `https://graph.facebook.com/v18.0/oauth/access_token?client_secret=${
    import.meta.env.VITE_FACEBOOK_APP_SECRET
  }`
);
```

**Use:**

```javascript
// ✅ CORRECT - Backend exchanges token
const exchangeToken = httpsCallable(functions, "exchangeFacebookToken");
const result = await exchangeToken({ code });
```

---

## GEMINI API KEY Issue

**Current setup:**

```
VITE_GEMINI_API_KEY (in frontend)
```

**Correct setup:**

```
GEMINI_API_KEY (Cloud Functions only)
```

Even though Gemini API is free, the key should NOT be in frontend. Reasons:

1. Any user can see it in network inspection
2. Rate limits apply per API key (users could exhaust your quota)
3. Best practice security principle

---

## Complete Environment Variable List (CORRECTED)

### Frontend (.env.local / Netlify)

```
# ✅ FRONTEND-SAFE ONLY

# Firebase (public config)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_MEASUREMENT_ID=xxx

# Paystack (public key only)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxx

# OAuth Client IDs (no secrets!)
VITE_FACEBOOK_APP_ID=xxx
VITE_TIKTOK_CLIENT_KEY=xxx
VITE_GOOGLE_CLIENT_ID=xxx
VITE_TWITTER_CLIENT_ID=xxx
VITE_LINKEDIN_CLIENT_ID=xxx
```

### Cloud Functions Only (Firebase Functions Config)

```
firebase functions:config:set \
  facebook.app_id="xxx" \
  facebook.app_secret="sk_xxx" \
  tiktok.client_key="xxx" \
  tiktok.client_secret="sk_xxx" \
  youtube.client_secret="sk_xxx" \
  gemini.api_key="xxx" \
  paystack.secret_key="sk_xxx"
```

---

## Security Checklist

- [ ] Remove all \*\_SECRET from frontend variables
- [ ] Move OAuth token exchange to Cloud Functions
- [ ] Remove VITE_GEMINI_API_KEY from frontend
- [ ] Add GEMINI_API_KEY to Cloud Functions config only
- [ ] Redeploy Cloud Functions with new config
- [ ] Redeploy Netlify without secret variables
- [ ] Regenerate all API keys (they were exposed)
- [ ] Delete old secrets from Netlify environment
- [ ] Verify no secrets in network requests

---

## Files That Need Updates

1. **src/services/socialMediaService.js**

   - Replace all OAuth token exchanges with Cloud Function calls
   - Remove `VITE_` references for secrets

2. **src/services/aiService.js**

   - Remove VITE_GEMINI_API_KEY usage
   - Move Gemini calls to Cloud Function

3. **functions/index.js**

   - Add `exchangeFacebookToken()` function
   - Add `exchangeTikTokToken()` function
   - Add `exchangeYouTubeToken()` function
   - Gemini API calls already here ✅

4. **.env.example**
   - Fix to show correct naming (no VITE\_ for secrets)

---

## How to Regenerate Your Keys

After fixing this, you MUST regenerate:

1. **Facebook App Secret**

   - Go to: developers.facebook.com > Settings > Basic
   - Show App Secret > Reset

2. **TikTok Client Secret**

   - Go to: tiktok.com/developers > Apps > Settings
   - Regenerate secret

3. **YouTube Client Secret**

   - Go to: console.cloud.google.com > OAuth consent screen
   - Recreate OAuth 2.0 credentials

4. **Gemini API Key**
   - Go to: ai.google.dev > Get API key
   - Create new key

---

## Summary

| Item                           | Status          | Action                                       |
| ------------------------------ | --------------- | -------------------------------------------- |
| **VITE_FACEBOOK_APP_SECRET**   | ❌ Exposed      | Delete from Netlify, move to Cloud Functions |
| **VITE_TIKTOK_CLIENT_SECRET**  | ❌ Exposed      | Delete from Netlify, move to Cloud Functions |
| **VITE_YOUTUBE_CLIENT_SECRET** | ❌ Exposed      | Delete from Netlify, move to Cloud Functions |
| **VITE_GEMINI_API_KEY**        | ❌ Wrong naming | Delete from Netlify, add to Cloud Functions  |
| **Facebook token exchange**    | ❌ Frontend     | Move to Cloud Function                       |
| **TikTok token exchange**      | ❌ Frontend     | Move to Cloud Function                       |
| **YouTube token exchange**     | ❌ Frontend     | Move to Cloud Function                       |

**Priority:** HIGH - Fix before deploying to production
