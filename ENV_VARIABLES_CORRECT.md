# ✅ CORRECT Environment Variables Setup

**FIXED - All security issues corrected**

---

## 🔒 NAMING RULES (CRITICAL)

### ✅ SAFE: Frontend (use VITE\_ prefix)

- **App IDs, Client IDs** - Public, needed for OAuth redirect
- **Public API Keys** - Keys that don't grant permissions
- **Configuration** - Public settings

### ❌ UNSAFE: Never expose in frontend

- **Secret Keys** - App secrets, API secrets
- **Tokens** - Access tokens, refresh tokens
- **Passwords** - Database credentials
- **Private Keys** - Signing keys

---

## 📋 NETLIFY BUILD VARIABLES

These go in: **Netlify → Site Settings → Build & Deploy → Environment**

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_TIKTOK_CLIENT_KEY=your-tiktok-client-key
VITE_YOUTUBE_CLIENT_ID=your-youtube-client-id
```

**Note:** All VITE\_ variables are exposed in bundle. Only public IDs/keys.

---

## 🔐 CLOUD FUNCTIONS ENVIRONMENT (Backend Only)

These go in: **Firebase Cloud Functions Config** (NOT visible in browser)

```bash
firebase functions:config:set \
  gemini.api_key="your-free-gemini-key" \
  facebook.app_id="your-facebook-app-id" \
  facebook.app_secret="your-facebook-app-secret" \
  tiktok.client_key="your-tiktok-key" \
  tiktok.client_secret="your-tiktok-secret" \
  youtube.client_secret="your-youtube-secret" \
  paystack.secret_key="sk_live_xxxxx"
```

**Or in Netlify Functions:**

```
GEMINI_API_KEY=your-key
FACEBOOK_APP_ID=your-id
FACEBOOK_APP_SECRET=your-secret
TIKTOK_CLIENT_KEY=your-key
TIKTOK_CLIENT_SECRET=your-secret
YOUTUBE_CLIENT_SECRET=your-secret
PAYSTACK_SECRET_KEY=sk_live_xxxxx
```

---

## ❌ KEYS TO REMOVE FROM NETLIFY

DELETE these from Netlify immediately:

```
❌ VITE_FACEBOOK_APP_SECRET     ← EXPOSED!
❌ VITE_PERPLEXITY_API_KEY      ← Removed (using free Gemini)
❌ VITE_CLAUDE_API_KEY          ← Removed (using free Gemini)
❌ VITE_GEMINI_API_KEY          ← MOVE TO Cloud Functions
❌ VITE_R2_ACCESS_KEY_ID        ← Move to Cloud Functions
❌ VITE_R2_SECRET_ACCESS_KEY    ← Move to Cloud Functions
❌ VITE_TIKTOK_CLIENT_SECRET    ← Move to Cloud Functions
❌ VITE_YOUTUBE_CLIENT_SECRET   ← Move to Cloud Functions
```

---

## ✅ COMPLETE VARIABLE LIST (CORRECTED)

### Frontend Safe (VITE\_)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FACEBOOK_APP_ID              ← App ID only (no secret)
VITE_TIKTOK_CLIENT_KEY            ← Client Key only (no secret)
VITE_YOUTUBE_CLIENT_ID            ← Client ID only (no secret)
```

### Backend Only (Cloud Functions)

```
GEMINI_API_KEY                    ← Free Google API (secure)
FACEBOOK_APP_SECRET               ← Secret stays on backend
TIKTOK_CLIENT_SECRET              ← Secret stays on backend
YOUTUBE_CLIENT_SECRET             ← Secret stays on backend
PAYSTACK_SECRET_KEY               ← Secret stays on backend
PAYSTACK_PUBLIC_KEY               ← Can be in frontend (different key)
R2_ACCOUNT_ID                     ← Can be public
R2_ACCESS_KEY_ID                  ← Secret stays on backend
R2_SECRET_ACCESS_KEY              ← Secret stays on backend
```

---

## 🚀 DEPLOYMENT STEPS (FIXED)

### Step 1: Clean Up Netlify

1. Go to Netlify → Site Settings → Build & Deploy → Environment
2. **DELETE ALL SECRET KEYS** (everything except VITE\_ public ones)
3. Only keep:
   - VITE*FIREBASE*\*
   - VITE_FACEBOOK_APP_ID
   - VITE_TIKTOK_CLIENT_KEY
   - VITE_YOUTUBE_CLIENT_ID

### Step 2: Set Firebase Cloud Functions Environment

```bash
cd functions

# Set environment variables (secrets stay secure on backend)
firebase functions:config:set \
  gemini.api_key="your-free-api-key" \
  facebook.app_secret="your-app-secret" \
  tiktok.client_secret="your-secret" \
  youtube.client_secret="your-secret" \
  paystack.secret_key="sk_live_xxxxx"

# Deploy functions
firebase deploy --only functions
```

### Step 3: Get Free API Keys

- **Gemini:** https://ai.google.dev/ (free, 60 calls/min)

### Step 4: Test Locally

```bash
npm run dev
# Content generation should work (calls backend)
# No API keys exposed in Network tab
```

---

## 🔍 HOW TO VERIFY IT'S FIXED

### Check 1: Network Tab (in browser DevTools)

1. Open app → DevTools → Network tab
2. Click "Generate Content"
3. **Look for:** Request to `_next/api/generateContent` or similar (backend)
4. **DO NOT see:** Direct request to `api.anthropic.com` or similar
5. **DO NOT see:** API keys in request headers or body

### Check 2: Source Code

Search code for exposed keys:

```bash
grep -r "VITE_.*SECRET" src/          # Should return nothing
grep -r "VITE_.*KEY" src/              # Only GEMINI should show (will remove)
grep -r "process.env" src/             # Should return nothing
```

### Check 3: Netlify Build Logs

1. Go to Netlify → Deployments
2. Click recent deploy → Build logs
3. **DO NOT see:** Secret keys in logs
4. **DO NOT see:** Any exposed credentials

---

## 🔐 WHAT'S CHANGED IN CODE

### aiService.js

**Before:** Frontend directly called Gemini API with `VITE_GEMINI_API_KEY`
**After:** Calls Cloud Function, backend has the key

### socialMediaService.js

**Before:** Frontend exchanged OAuth code with `VITE_FACEBOOK_APP_SECRET`
**After:** Calls `exchangeFacebookToken` Cloud Function, backend has secret

### functions/index.js

**New:** Added `exchangeFacebookToken` and `postToFacebook` Cloud Functions

---

## 📊 ENVIRONMENT SUMMARY

| Variable              | Type   | Where           | Visible      | Risk |
| --------------------- | ------ | --------------- | ------------ | ---- |
| VITE_FIREBASE_API_KEY | Public | Netlify         | Browser      | Low  |
| VITE_FACEBOOK_APP_ID  | Public | Netlify         | Browser      | Low  |
| GEMINI_API_KEY        | Secret | Cloud Functions | Only Backend | None |
| FACEBOOK_APP_SECRET   | Secret | Cloud Functions | Only Backend | None |
| PAYSTACK_SECRET_KEY   | Secret | Cloud Functions | Only Backend | None |

---

## ✅ SECURITY CHECKLIST

- [ ] Removed `VITE_FACEBOOK_APP_SECRET` from Netlify
- [ ] Removed `VITE_GEMINI_API_KEY` from Netlify
- [ ] Removed `VITE_CLAUDE_API_KEY` from Netlify
- [ ] Removed `VITE_PERPLEXITY_API_KEY` from Netlify
- [ ] Removed `VITE_TIKTOK_CLIENT_SECRET` from Netlify
- [ ] Removed `VITE_YOUTUBE_CLIENT_SECRET` from Netlify
- [ ] Set `GEMINI_API_KEY` in Cloud Functions (backend only)
- [ ] Set `FACEBOOK_APP_SECRET` in Cloud Functions (backend only)
- [ ] Tested: No secrets in Network tab
- [ ] Tested: Content generation works (via backend)
- [ ] Redeployed: `firebase deploy --only functions`

---

## 🚨 IF YOU SEE EXPOSED KEYS IN NETLIFY

**Netlify will show warning:** "This variable appears to contain credentials"

**What to do:**

1. Immediately delete the variable
2. Rotate the exposed key (get new secret from service)
3. Move it to Cloud Functions instead
4. Update and redeploy

**Facebook App Secret Example:**

- Go to Facebook Developers → Your App → Settings → Basic
- Generate new App Secret
- Remove old one from Netlify
- Set new one in Cloud Functions

---

## AFTER YOU'VE FIXED THIS:

Your app will be:

- ✅ No exposed secrets
- ✅ No Netlify security warnings
- ✅ Compliant with OAuth security best practices
- ✅ Ready for production
