# 📚 MARKET MIND - COMPLETE PROJECT DOCUMENTATION

**Last Updated:** December 28, 2025  
**Version:** 1.0.0 Production Ready  
**Status:** ✅ Ready for Deployment

---

## 📖 TABLE OF CONTENTS

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Environment Setup](#environment-setup)
4. [Features & Tiers](#features--tiers)
5. [Deployment Guide](#deployment-guide)
6. [Social Media Integration](#social-media-integration)
7. [Payment Processing](#payment-processing)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

---

## 🚀 QUICK START

### For Developers

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (already created in project)
# Copy provided values into .env.local

# 3. Start development server
npm run dev

# Opens at: http://localhost:5173
```

### For Deployment

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Netlify auto-deploys (if connected)
# Check: https://app.netlify.com

# 3. Deploy Cloud Functions
cd functions
firebase deploy --only functions
cd ..

# 4. Test on production
# Visit: https://marketmind-02.netlify.app
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack

| Layer        | Technology               | Purpose              |
| ------------ | ------------------------ | -------------------- |
| **Frontend** | React 18 + Vite          | UI & routing         |
| **State**    | Context API              | Global auth state    |
| **Backend**  | Firebase Cloud Functions | API logic            |
| **Database** | Firestore                | User & content data  |
| **Storage**  | Firebase Storage         | Images & assets      |
| **Auth**     | Firebase Authentication  | User login/signup    |
| **Payments** | Paystack                 | Subscription billing |
| **AI**       | Google Gemini (free)     | Content generation   |
| **Hosting**  | Netlify                  | Frontend + Functions |

### System Flow

```
User
  ↓
[React Frontend] ← Environment Variables (.env.local or Netlify)
  ↓
[Firebase Auth] ← Authenticates user
  ↓
[Cloud Functions] ← Handles sensitive operations
  ↓
[Firestore] ← Stores user data
  ↓
[External APIs] ← OAuth, Gemini, Paystack
```

### Folder Structure

```
marketmind-new/
├── src/
│   ├── components/          # Reusable React components
│   ├── context/             # Auth state management
│   ├── features/            # Feature modules (auth, content, etc)
│   ├── pages/               # Page components
│   ├── services/            # API & external service calls
│   ├── utils/               # Utility functions
│   ├── App.jsx              # Main app routing
│   └── main.jsx             # Entry point
├── functions/               # Firebase Cloud Functions
│   ├── index.js            # Main functions
│   ├── oauthExchange.js    # OAuth handling
│   └── paystack.js         # Payment functions
├── netlify/
│   └── functions/          # Netlify serverless functions
│       └── oauth-exchange.js  # OAuth token exchange
├── public/                 # Static files
├── .env.local              # Local environment variables (NOT committed)
├── .env.example            # Template for env variables
├── firebase.json           # Firebase config
├── firestore.rules         # Firestore security rules
├── vite.config.js          # Vite config
└── netlify.toml            # Netlify config
```

---

## ⚙️ ENVIRONMENT SETUP

### Step 1: Get All Credentials

#### Firebase (Required)

1. Go to [firebase.google.com](https://firebase.google.com)
2. Create project or use existing
3. Go to Project Settings → Web SDK config
4. Copy all 7 values

#### Google Gemini API (Required for content generation)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key"
3. Save the key

#### Paystack (Required for payments)

1. Go to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Settings → API Keys & Webhooks
3. Copy Public Key (starts with `pk_`)
4. Copy Secret Key (starts with `sk_`) - backend only

#### Facebook/Instagram (For social media linking)

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create App or use existing
3. Get App ID and App Secret
4. Register OAuth redirect URIs:
   - `https://marketmind-02.netlify.app/auth/facebook/callback`

#### YouTube (For social media linking)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorized redirect URIs:
   - `http://localhost:5173/auth/youtube/callback`
   - `https://marketmind-02.netlify.app/auth/youtube/callback`
5. Get Client ID and Client Secret

#### TikTok (For social media linking)

1. Go to [developers.tiktok.com](https://developers.tiktok.com)
2. Create Application
3. Get Client ID and Client Secret
4. Add Redirect URL:
   - `https://marketmind-02.netlify.app/auth/tiktok/callback`

#### Twitter/X (For social media linking)

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create Application
3. Get API Key and API Secret
4. Enable OAuth 2.0
5. Add redirect URL:
   - `https://marketmind-02.netlify.app/auth/twitter/callback`

### Step 2: Populate .env.local

The `.env.local` file is already created. Fill in your values:

```env
# Firebase (Get from Firebase Console)
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
VITE_FIREBASE_STORAGE_BUCKET=your_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
VITE_FIREBASE_APP_ID=your_value

# Social Media OAuth (PUBLIC IDs only)
VITE_FACEBOOK_APP_ID=your_value
VITE_INSTAGRAM_APP_ID=your_value
VITE_YOUTUBE_CLIENT_ID=your_value
VITE_TIKTOK_CLIENT_KEY=your_value
VITE_TWITTER_API_KEY=your_value

# Payment (PUBLIC key only)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_value
```

**⚠️ IMPORTANT:** Never add secrets (API_SECRET, CLIENT_SECRET, etc) to .env.local. They go to Netlify Functions environment variables only.

### Step 3: Set Netlify Environment Variables

Netlify Dashboard → Build & Deploy → Environment

**Add Frontend Variables (VITE\_\*):**

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FACEBOOK_APP_ID
VITE_INSTAGRAM_APP_ID
VITE_YOUTUBE_CLIENT_ID
VITE_TIKTOK_CLIENT_KEY
VITE_TWITTER_API_KEY
VITE_PAYSTACK_PUBLIC_KEY
```

**Add Backend Secrets (No VITE\_ prefix):**

```
GEMINI_API_KEY
FACEBOOK_APP_SECRET
FACEBOOK_CLIENT_ID
YOUTUBE_CLIENT_SECRET
TIKTOK_CLIENT_SECRET
TWITTER_API_SECRET
PAYSTACK_SECRET_KEY
```

### Step 4: Deploy Cloud Functions

```bash
cd functions

# Configure secrets for Cloud Functions
firebase functions:config:set \
  gemini.api_key="your_gemini_key" \
  facebook.app_secret="your_facebook_secret" \
  youtube.client_secret="your_youtube_secret" \
  tiktok.client_secret="your_tiktok_secret" \
  twitter.api_secret="your_twitter_secret" \
  paystack.secret_key="your_paystack_secret"

# Deploy
firebase deploy --only functions

cd ..
```

### Step 5: Setup Cloudinary Storage (for file uploads)

**What is Cloudinary?**

Cloudinary is a cloud-based image and video management platform. It handles file uploads, storage, delivery via CDN, and automatic image optimization. Much simpler than S3-like solutions!

**Get Cloudinary Credentials:**

**Complete step-by-step guide:** See [CLOUDINARY_MIGRATION_GUIDE.md](CLOUDINARY_MIGRATION_GUIDE.md)

**Quick summary:**

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Go to Dashboard
4. Copy your **Cloud Name** (top left)
5. Go to Settings → Access Keys
6. Copy your **API Key**
7. Go to Settings → Upload → Upload Presets
8. Create an **Unsigned** preset named `marketmind-uploads`

**Add to .env.local (for local testing):**

```env
# Cloudinary Storage (for file uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
VITE_CLOUDINARY_UPLOAD_PRESET=marketmind-uploads
```

**Add to Netlify Environment Variables:**

In Netlify Dashboard → Build & Deploy → Environment, add:

```
VITE_CLOUDINARY_CLOUD_NAME      (public - safe to expose)
VITE_CLOUDINARY_API_KEY          (public - safe to expose)
VITE_CLOUDINARY_UPLOAD_PRESET    (public - safe to expose)
CLOUDINARY_API_SECRET            (secret - only for backend operations)
```

**How Cloudinary is Used:**

- Frontend uploads files directly to Cloudinary (no backend needed for basic uploads)
- Cloudinary provides optimized public URLs
- Automatic image optimization and CDN delivery
- Easy image transformations (resize, crop, filters, etc.)
- Support for images and videos

**Where It's Used in Code:**

- [src/services/storageService.js](src/services/storageService.js) - Upload and optimization functions
- [functions/index.js](functions/index.js) - Cloud Functions integration

**Verification:**

After setup, test upload by:

1. Go to `/dashboard` → Generate Content
2. Create content (generates a file)
3. Check Cloudinary Media Library to see uploaded file
4. File should be accessible via Cloudinary public URL

**Full Setup Guide:** [CLOUDINARY_MIGRATION_GUIDE.md](CLOUDINARY_MIGRATION_GUIDE.md) (45 minutes, step-by-step)

---

## 💎 FEATURES & TIERS

### FREE Tier

- **Cost:** ₦0/month
- **Features:**
  - 10 content posts/month
  - 5 research queries/month
  - 1 business profile
  - Basic content generation
  - Email support

### PRO Tier

- **Cost:** ₦9,999/month
- **Features:**
  - 100 content posts/month
  - 50 research queries/month
  - Unlimited businesses
  - All social platforms (including YouTube)
  - Priority email support

### ENTERPRISE Tier

- **Cost:** Custom pricing
- **Features:**
  - Unlimited posts & research
  - Unlimited businesses
  - All platforms
  - Phone support
  - Custom integrations

### Usage Tracking

System automatically tracks:

- Monthly post count (resets on 1st of month)
- Monthly research count (resets on 1st of month)
- Connected social accounts
- Payment history

Stored in Firestore:

- `/usage/{userId}` - Monthly usage stats
- `/subscriptions/{userId}` - Subscription details

---

## 🚀 DEPLOYMENT GUIDE

### Prerequisites

- [ ] GitHub repository created
- [ ] Netlify account (free)
- [ ] Firebase project created
- [ ] All environment variables obtained
- [ ] .env.local filled with values

### Deployment Steps

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

#### Step 2: Connect Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub
4. Select repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click Deploy

#### Step 3: Add Environment Variables

In Netlify:

1. Site Settings → Build & Deploy → Environment
2. Add all VITE\_\* variables (from .env.local)
3. Add all backend secrets

#### Step 4: Trigger Deploy

1. Netlify automatically deploys on git push
2. Or manually: Site Settings → Trigger Deploy

#### Step 5: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

#### Step 6: Register OAuth Redirect URIs

For each platform (Facebook, YouTube, TikTok, Twitter):

1. Update callback URL to production: `https://marketmind-02.netlify.app/auth/{platform}/callback`
2. Verify it matches what you registered

#### Step 7: Test Everything

```bash
# Test sign up
Visit https://marketmind-02.netlify.app
Create an account

# Test sign in
Log in with email

# Test content generation
Go to /generate and create content

# Test payment
Go to /pricing and try upgrading

# Test social linking
Go to /accounts and connect a platform
```

---

## 🔗 SOCIAL MEDIA INTEGRATION

### How Social Linking Works

```
User clicks "Connect Instagram"
  ↓
[Frontend] Redirects to Facebook OAuth
  ↓
User authorizes on Facebook
  ↓
User redirected back to app with authorization CODE
  ↓
[OAuthCallback.jsx] Calls backend to exchange code for TOKEN
  ↓
[oauth-exchange.js] (Netlify Function) exchanges code
  ↓
Token stored in Firestore (encrypted)
  ↓
User sees "Connected!" message
```

### Why Linking Might Not Work

**❌ Problem:** You tried linking after setting env vars in Netlify but didn't trigger redeploy

**✅ Solution:**

1. Set env variables in Netlify
2. Trigger deploy: Site Settings → Trigger Deploy
3. **Wait for build to complete** (check Deploys tab)
4. Only then try linking again

**Why it matters:**

- Environment variables are only loaded DURING build
- Setting them doesn't affect already-deployed code
- You must redeploy to use new variables
- Without redeploy, app still has old code without env vars

### Other Common Issues

**Issue:** "Authorization failed" when clicking Connect

- **Cause:** Client ID not set in Netlify env vars
- **Fix:** Add VITE_FACEBOOK_APP_ID, etc. to Netlify environment

**Issue:** Redirect to wrong URL

- **Cause:** APP_URL is hardcoded to `https://marketmind-02.netlify.app`
- **Fix:** If your domain changed, update APP_URL in [socialAuthService.js](src/services/socialAuthService.js#L8)

**Issue:** "Connection Failed" after authorizing

- **Cause:** Backend function not deployed or oauth-exchange.js has error
- **Fix:** Check Netlify Functions logs: Netlify → Functions

**Issue:** Token not saved to database

- **Cause:** Firestore security rules blocking writes
- **Fix:** Check Firestore rules in `firestore.rules` allow writes

**Issue:** Same issue on multiple platforms

- **Cause:** One of the above affects all platforms
- **Fix:** Check order: 1) Env vars set? 2) Deploy triggered? 3) Functions running?

### Supported Platforms

| Platform  | Status   | Notes                   |
| --------- | -------- | ----------------------- |
| Facebook  | ✅ Ready | Need App ID & Secret    |
| Instagram | ✅ Ready | Uses Facebook app       |
| YouTube   | ✅ Ready | Need Client ID & Secret |
| TikTok    | ✅ Ready | Need Client ID & Secret |
| Twitter/X | ✅ Ready | Need API Key & Secret   |
| LinkedIn  | ⚠️ Ready | Not tested              |
| Pinterest | ⚠️ Ready | Not tested              |
| Snapchat  | ⚠️ Ready | Not tested              |

---

## 💳 PAYMENT PROCESSING

### Paystack Integration

#### Test Mode

- **Public Key:** `pk_test_xxxxx`
- **Test Card:** 4111111111111111
- **Expiry:** Any future date
- **CVV:** 123

#### Production Mode

- **Public Key:** `pk_live_xxxxx`
- **Real Cards:** Your customers' cards
- **Real Charges:** Real money

### Payment Flow

```
User clicks "Upgrade to Pro"
  ↓
[Pricing.jsx] Initializes Paystack
  ↓
Paystack modal opens
  ↓
User enters payment info
  ↓
[initializePayment] Cloud Function creates transaction
  ↓
Paystack charges card
  ↓
Webhook sent to backend (optional)
  ↓
User upgraded to PRO tier
  ↓
Limits updated (100 posts/month, etc)
```

### Testing Payments

1. Set `VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx` in .env.local
2. Go to /pricing
3. Click "Upgrade to Pro"
4. Use test card: 4111111111111111
5. Expiry: 12/25
6. CVV: 123
7. Click Pay
8. Should show success

### Webhook Handling (Optional)

Paystack can send webhooks to confirm payment. Set up in:
Paystack Dashboard → Settings → Webhooks

URL: `https://marketmind-02.netlify.app/.netlify/functions/paystack-webhook`

Currently the app handles webhooks but you can add extra logic to update subscription status.

---

## 🔧 TROUBLESHOOTING

### App won't load (npm run dev fails)

**Error:** `Cannot find module 'react'`

```bash
npm install
```

**Error:** `VITE_FIREBASE_API_KEY is undefined`

- Check .env.local exists
- Check values are filled in
- Restart dev server: `npm run dev`

**Error:** `Port 5173 already in use`

```bash
npm run dev -- --port 3000
```

### Firebase not connecting

**Error:** `Firebase: Error (auth/invalid-api-key)`

- VITE_FIREBASE_API_KEY is wrong
- Check Firebase Console → Project Settings
- Make sure values match

**Error:** `Firestore: Error (permission-denied)`

- Security rules are too restrictive
- Check [firestore.rules](firestore.rules)
- Make sure rules allow authenticated users

### Social media linking fails

**Error:** "Client ID not found"

1. Check Netlify environment variables are set
2. Trigger deploy: Site Settings → Trigger Deploy
3. Wait for build to complete
4. Try again

**Error:** "OAuth callback returned 404"

1. Check netlify/functions/oauth-exchange.js exists
2. Check Netlify Functions logs
3. Verify callback URL registered on platform

### Content generation fails

**Error:** "GEMINI_API_KEY not set"

1. Check Cloud Functions config:
   ```bash
   firebase functions:config:get
   ```
2. If not set:
   ```bash
   firebase functions:config:set gemini.api_key="your_key"
   firebase deploy --only functions
   ```

**Error:** "Failed to generate content"

- Gemini API quota exceeded
- Check Google AI Studio for usage
- Free tier has 60 calls/minute limit

### Payment doesn't work

**Error:** "Payment modal doesn't open"

- VITE_PAYSTACK_PUBLIC_KEY not set
- Check Netlify env vars
- Trigger deploy

**Error:** "Payment failed after entering card"

- Using wrong key (test vs live)
- Card declined (test card is 4111111111111111)
- Check Paystack dashboard for details

### Database issues

**Error:** "Firestore write failed"

1. Check security rules in Netlify (if changed)
2. Run: `firebase firestore:rules:deploy`
3. Check user is authenticated

**Error:** "Data not saved to Firestore"

- Firestore quota exceeded (free tier: 50k writes/day)
- Check Firestore usage in Firebase Console
- Consider upgrading to Blaze plan

---

## 📡 API REFERENCE

### Cloud Functions

#### generateContent

```
Callable Function
URL: https://us-central1-{project}.cloudfunctions.net/generateContent

Input:
{
  prompt: string,        // What to generate
  tone: string,         // Tone (professional, casual, etc)
  businessContext: string  // Business description
}

Output:
{
  success: boolean,
  content: string       // Generated content
}

Limits:
- FREE: 10/month
- PRO: 100/month
- ENTERPRISE: unlimited
```

#### conductResearch

```
Callable Function
Input:
{
  topic: string,
  businessNiche: string
}

Output:
{
  success: boolean,
  insights: string
}

Limits:
- FREE: 5/month
- PRO: 50/month
- ENTERPRISE: unlimited
```

#### initializePayment

```
Callable Function
Input:
{
  tier: string,        // 'pro' or 'enterprise'
  email: string,
  amount: number
}

Output:
{
  success: boolean,
  authUrl: string      // Paystack URL
}
```

### REST Endpoints

#### OAuth Token Exchange

```
POST /.netlify/functions/oauth-exchange

Body:
{
  platform: string,     // 'facebook', 'youtube', 'tiktok'
  code: string,        // Authorization code from provider
  redirectUri: string,
  userId: string
}

Response:
{
  success: boolean,
  accessToken: string,
  expiresIn: number
}
```

---

## 🔐 SECURITY CHECKLIST

- [ ] .env.local is in .gitignore
- [ ] .env.local is NOT committed to git
- [ ] All secrets stored only in Netlify or Cloud Functions
- [ ] No VITE\_ prefix on secret variables
- [ ] OAuth redirect URIs registered on all platforms
- [ ] Firestore rules reviewed and deployed
- [ ] Firebase functions deployed
- [ ] Netlify environment variables set
- [ ] No console.log of sensitive data
- [ ] CORS properly configured

---

## 📞 SUPPORT

### Common Questions

**Q: Can I use this on a different domain?**
A: Yes, but update:

1. OAuth redirect URIs on each platform
2. CORS headers in oauth-exchange.js
3. APP_URL in socialAuthService.js

**Q: How do I upgrade from test to production?**
A: Change VITE*PAYSTACK_PUBLIC_KEY from `pk_test*`to`pk*live*` and redeploy

**Q: Can I add more social platforms?**
A: Yes, add to OAUTH_CONFIG in socialAuthService.js and register with platform

**Q: How do I backup user data?**
A: Firestore → Manage → Export Collection (automatic daily backups on paid plans)

**Q: Can I customize the UI?**
A: Yes, all CSS is in .css files alongside components

**Q: Where are my users' social tokens stored?**
A: Encrypted in Firestore at `/users/{userId}/socialConnections/{platform}`

---

**Generated:** December 28, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
