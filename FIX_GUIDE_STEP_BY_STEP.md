# 🔧 STEP-BY-STEP FIX GUIDE

## CRITICAL FIX #1: Remove Exposed YouTube Credentials (5 minutes)

### Step 1: Revoke Compromised Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services → Credentials**
4. Find and delete the exposed API key: `AIzaSyAv-WGy8mkpb-qLpEh5zFzIHhanHlhwKdA`
5. Find and delete the exposed OAuth credential with secret: `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`

### Step 2: Clean Up Your Repo

Open `netlify.toml` and replace lines 1-3:

**BEFORE:**

```plaintext
youtube api key: AIzaSyAv-WGy8mkpb-qLpEh5zFzIHhanHlhwKdA
youtube client id  key-latest:  897332196564-aauq3khml8cpjmk44048n6vtklcmhqcr.apps.googleusercontent.com
youtube client secret: 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
```

**AFTER:**

```plaintext
# =====================================================
# YOUTUBE OAUTH CONFIGURATION
# =====================================================
# Client ID and Secret should be in environment variables
# DO NOT commit credentials to source code
```

### Step 3: Generate New YouTube Credentials

1. In Google Cloud Console: **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth 2.0 Client ID**
3. Choose: **Web application**
4. Under "Authorized redirect URIs" add:
   - `http://localhost:5173/auth/youtube/callback` (local dev)
   - `https://your-netlify-domain.netlify.app/auth/youtube/callback` (production)
5. Click Create
6. Download the JSON file and save it securely
7. Note down the Client ID and Client Secret

---

## CRITICAL FIX #2: Create Environment Variables File (10 minutes)

### Step 1: Create .env.local

In your project root, create a file named `.env.local`:

```bash
# Navigate to project root
cd c:\Users\Admin\MarketMind\marketmind-new

# Create .env.local
echo. > .env.local
```

### Step 2: Get Firebase Credentials

1. Go to [firebase.google.com](https://firebase.google.com)
2. Click on your project
3. Go to **Project Settings → General**
4. Scroll to "Your apps" and click on your web app
5. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123...",
};
```

### Step 3: Populate .env.local

Open `.env.local` and add:

```env
# =====================================================
# FIREBASE CONFIGURATION
# =====================================================
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...

# =====================================================
# SOCIAL MEDIA OAUTH (PUBLIC IDS ONLY)
# =====================================================
VITE_FACEBOOK_APP_ID=123456789
VITE_INSTAGRAM_APP_ID=123456789
VITE_TIKTOK_CLIENT_KEY=abc123def456
VITE_YOUTUBE_CLIENT_ID=123456.apps.googleusercontent.com
VITE_TWITTER_API_KEY=xyz123

# =====================================================
# PAYMENT GATEWAY
# =====================================================
VITE_PAYSTACK_PUBLIC_KEY=pk_live_abc123...
```

Replace all `...` with your actual credentials.

### Step 4: Add to .gitignore

Make sure `.env.local` is in your `.gitignore` so it never gets committed:

```bash
# Check if .gitignore exists
type .gitignore

# Add to .gitignore if not there
echo .env.local >> .gitignore
echo .env.*.local >> .gitignore
```

---

## CRITICAL FIX #3: Deploy Cloud Functions (15 minutes)

### Step 1: Check Firebase Setup

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Check which project is configured
firebase projects:list
```

### Step 2: Set Cloud Functions Environment Variables

```bash
# Navigate to functions directory
cd c:\Users\Admin\MarketMind\marketmind-new\functions

# Set Gemini API key (for content generation)
firebase functions:config:set gemini.api_key="your-gemini-api-key-here"

# Set OAuth secrets (for token exchange)
firebase functions:config:set \
  facebook.app_id="your-facebook-app-id" \
  facebook.app_secret="your-facebook-app-secret" \
  youtube.client_secret="your-youtube-client-secret" \
  tiktok.client_secret="your-tiktok-client-secret" \
  twitter.api_secret="your-twitter-api-secret"

# Set payment gateway
firebase functions:config:set paystack.secret_key="your-paystack-secret-key"
```

### Step 3: Deploy Functions

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Watch the output - should see:
# ✓ functions[generateContent(us-central1)] Successful create operation.
# ✓ functions[conductResearch(us-central1)] Successful create operation.
# etc.
```

### Step 4: Verify Deployment

```bash
# List deployed functions
firebase functions:list

# Check function logs
firebase functions:log

# Call a function to test
firebase functions:shell
```

---

## CRITICAL FIX #4: Configure Netlify Environment (10 minutes)

### Step 1: Set Frontend Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: **marketmind-02.netlify.app**
3. Go to **Build & Deploy → Environment**
4. Click **Edit variables**
5. Add these variables (copy from your .env.local):

```
Key: VITE_FIREBASE_API_KEY
Value: [your firebase api key]

Key: VITE_FIREBASE_AUTH_DOMAIN
Value: [your firebase auth domain]

Key: VITE_FIREBASE_PROJECT_ID
Value: [your firebase project id]

Key: VITE_FIREBASE_STORAGE_BUCKET
Value: [your firebase storage bucket]

Key: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: [your firebase messaging sender id]

Key: VITE_FIREBASE_APP_ID
Value: [your firebase app id]

Key: VITE_FACEBOOK_APP_ID
Value: [your facebook app id]

Key: VITE_TIKTOK_CLIENT_KEY
Value: [your tiktok client key]

Key: VITE_YOUTUBE_CLIENT_ID
Value: [your youtube client id]

Key: VITE_TWITTER_API_KEY
Value: [your twitter api key]

Key: VITE_INSTAGRAM_APP_ID
Value: [your instagram app id]

Key: VITE_PAYSTACK_PUBLIC_KEY
Value: pk_live_[your paystack public key]
```

### Step 2: Set Backend Variables (Secrets)

Same location, add these with secret values:

```
Key: GEMINI_API_KEY
Value: [your gemini api key]

Key: YOUTUBE_CLIENT_SECRET
Value: [your youtube client secret]

Key: FACEBOOK_APP_SECRET
Value: [your facebook app secret]

Key: TIKTOK_CLIENT_SECRET
Value: [your tiktok client secret]

Key: TWITTER_API_SECRET
Value: [your twitter api secret]

Key: PAYSTACK_SECRET_KEY
Value: sk_live_[your paystack secret key]
```

### Step 3: Save and Trigger Rebuild

1. Click **Save** on environment variables
2. Go to **Deploys**
3. Click **Trigger deploy → Deploy site**
4. Wait for build to complete

---

## CRITICAL FIX #5: Register OAuth Redirect URIs (varies by platform)

### Facebook/Instagram

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select your app
3. Go to **Settings → Basic**
4. Under "App Domains" add: `marketmind-02.netlify.app`
5. Go to **Settings → Advanced**
6. Under "OAuth Redirect URIs" add:
   ```
   https://marketmind-02.netlify.app/auth/facebook/callback
   https://marketmind-02.netlify.app/auth/instagram/callback
   ```
7. Save changes

### YouTube / Google

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Go to **APIs & Services → Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs" add:
   ```
   http://localhost:5173/auth/youtube/callback
   https://marketmind-02.netlify.app/auth/youtube/callback
   ```
5. Save

### TikTok

1. Go to [developers.tiktok.com](https://developers.tiktok.com)
2. Select your app
3. Go to **Authorization** tab
4. Under "OAuth Redirect URL" add:
   ```
   https://marketmind-02.netlify.app/auth/tiktok/callback
   ```
5. Save

### Twitter

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Go to your app → **Settings**
3. Go to **Authentication settings**
4. Enable "3-legged OAuth"
5. Under "Callback URLs" add:
   ```
   http://localhost:5173/auth/twitter/callback
   https://marketmind-02.netlify.app/auth/twitter/callback
   ```
6. Save

---

## TESTING AFTER FIXES

### Test 1: Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# You should see:
# ✓ ready in 234ms
# ➜  Local:   http://localhost:5173/
```

### Test 2: Sign Up

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Create account with test email
4. Should redirect to dashboard
5. Check: No console errors

### Test 3: Firebase Connection

1. Open browser DevTools → Console
2. Go to your Netlify site
3. Should load without errors
4. Check: Firebase is initialized

### Test 4: OAuth (Social Login)

1. Go to http://localhost:5173/accounts
2. Click "Connect Facebook"
3. Should redirect to Facebook login
4. Authorize app
5. Should redirect back with success message

### Test 5: Content Generation (needs GEMINI_API_KEY)

1. Go to http://localhost:5173/generate
2. Enter prompt and click "Generate"
3. Should return content from Gemini API
4. Check: No "GEMINI_API_KEY not set" error

### Test 6: Payment Flow (needs PAYSTACK_PUBLIC_KEY)

1. Go to http://localhost:5173/pricing
2. Click "Upgrade to Pro"
3. Should open Paystack payment modal
4. Don't enter real credit card (it's test mode)
5. Cancel to close

---

## Quick Checklist for Deployment

### Before Pushing

- [ ] .env.local created with all values
- [ ] .env.local in .gitignore
- [ ] netlify.toml cleaned (no exposed keys)
- [ ] No console.log with sensitive data
- [ ] Local dev test passes: `npm run dev`
- [ ] Local sign up works
- [ ] Local OAuth flow works (at least redirect)

### Before Final Deploy

- [ ] Cloud Functions deployed: `firebase deploy --only functions`
- [ ] Netlify env vars set (frontend)
- [ ] Netlify function secrets set (backend)
- [ ] OAuth redirect URIs registered on all platforms
- [ ] GitHub push complete
- [ ] Netlify deployment complete

### After Deploy

- [ ] Visit https://marketmind-02.netlify.app
- [ ] Test sign up
- [ ] Test sign in
- [ ] Test content generation
- [ ] Test OAuth connection
- [ ] Check browser console for errors
- [ ] Check Firebase logs for errors
- [ ] Check Netlify function logs

---

## If Something Goes Wrong

### "Cannot find module 'firebase-functions'"

```bash
cd functions
npm install firebase-functions firebase-admin axios
cd ..
```

### "VITE_FIREBASE_API_KEY is undefined"

Check .env.local exists and has correct values

### "OAuth callback returns 404"

1. Check Netlify Functions are deployed
2. Check redirect URI registered on provider
3. Check netlify/functions/oauth-exchange.js exists

### "Content generation fails"

1. Check GEMINI_API_KEY is set in Cloud Functions config
2. Check functions deployed: `firebase deploy --only functions`
3. Check Cloud Functions logs for errors

### "Payment flow doesn't work"

1. Check VITE_PAYSTACK_PUBLIC_KEY is set
2. Check it starts with `pk_test_` or `pk_live_`
3. Check Paystack account is active

---

**Total Time to Fix:** ~2 hours  
**Difficulty:** Medium  
**Risk:** Low if following these steps

Once complete, your app should be ready for production!
