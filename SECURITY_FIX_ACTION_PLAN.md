# 🔧 IMMEDIATE ACTION PLAN - Security Fix

**Status:** Critical security vulnerability fixed in code  
**Timeline:** 15 minutes to fully secure

---

## ⏰ STEP-BY-STEP (DO THIS NOW)

### STEP 1: Delete Exposed Variables from Netlify (2 minutes)

1. Go to: https://app.netlify.com/sites/marketmind-02/configuration/env
2. Find and DELETE:

   - `VITE_FACEBOOK_APP_SECRET` ✅ DELETE
   - `VITE_GEMINI_API_KEY` ✅ DELETE
   - `VITE_CLAUDE_API_KEY` ✅ DELETE (already removed from code)
   - `VITE_PERPLEXITY_API_KEY` ✅ DELETE (already removed from code)
   - `VITE_TIKTOK_CLIENT_SECRET` ✅ DELETE (if exists)
   - `VITE_YOUTUBE_CLIENT_SECRET` ✅ DELETE (if exists)

3. Keep ONLY:
   - ✅ VITE_FIREBASE_API_KEY
   - ✅ VITE_FIREBASE_AUTH_DOMAIN
   - ✅ VITE_FIREBASE_PROJECT_ID
   - ✅ VITE_FIREBASE_STORAGE_BUCKET
   - ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
   - ✅ VITE_FIREBASE_APP_ID
   - ✅ VITE_FACEBOOK_APP_ID
   - ✅ VITE_TIKTOK_CLIENT_KEY
   - ✅ VITE_YOUTUBE_CLIENT_ID

### STEP 2: Deploy Code Changes (3 minutes)

```bash
cd c:\Users\Admin\Desktop\market mind

git add -A
git commit -m "🔒 Security fix: Move secrets to backend, remove from frontend"
git push origin main

# Netlify will auto-redeploy
```

### STEP 3: Set Firebase Cloud Functions Environment (5 minutes)

```bash
# Open Terminal/PowerShell
cd c:\Users\Admin\Desktop\market mind\functions

# Login to Firebase
firebase login

# Select your Firebase project
firebase use market-mind-prod  # (or your project ID)

# Set environment variables (BACKEND ONLY - SECURE)
firebase functions:config:set `
  gemini.api_key="your-free-gemini-api-key" `
  facebook.app_secret="sk_live_xxxxx" `
  tiktok.client_secret="your-secret" `
  youtube.client_secret="your-secret" `
  paystack.secret_key="sk_live_xxxxx"

# Verify they're set
firebase functions:config:get
```

### STEP 4: Deploy Cloud Functions (3 minutes)

```bash
firebase deploy --only functions

# Wait for completion message
# Should say: "Deploy complete!"
```

### STEP 5: Test It Works (2 minutes)

1. Go to: https://marketmind-02.netlify.app
2. Sign in
3. Go to "Generate Content"
4. Click "Generate Content" button
5. Should work ✅ (data comes from backend, not exposed)

### STEP 6: Verify No Secrets Exposed (1 minute)

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Generate Content"
4. Check requests:
   - ✅ Should call Cloud Function (backend)
   - ❌ Should NOT show API keys in request
   - ❌ Should NOT call external APIs directly

---

## 📝 CODE CHANGES MADE (Already Done)

✅ **src/services/aiService.js**

- Removed direct Gemini API calls
- Now calls `generateContent` Cloud Function
- Backend has the API key (secure)

✅ **src/services/socialMediaService.js**

- Removed direct Facebook token exchange
- Now calls `exchangeFacebookToken` Cloud Function
- Backend has the App Secret (secure)
- `postToFacebook` calls backend function

✅ **functions/index.js**

- Added `exchangeFacebookToken` function
- Added `postToFacebook` function
- Both have backend-only access to secrets

✅ **functions/package.json**

- Removed `@anthropic-ai/sdk` (using free Gemini via axios)

---

## 🚨 CRITICAL: What NOT to Do

❌ **Never do this:**

- Don't put secret keys in VITE\_ variables
- Don't put API calls in frontend code
- Don't commit .env files to Git
- Don't share API keys in Netlify env publicly

✅ **Always do this:**

- Keep secrets in Cloud Functions only
- Call backend functions from frontend
- Use VITE\_ only for public IDs
- Rotate keys if ever exposed

---

## ✅ VERIFICATION CHECKLIST

After completing steps 1-6, verify:

- [ ] Netlify env has no SECRET keys
- [ ] Code deployed successfully
- [ ] Cloud Functions have environment variables set
- [ ] Content generation works
- [ ] No API keys in browser Network tab
- [ ] No console errors

---

## IF SOMETHING GOES WRONG

### "Content generation fails"

```
→ Check Cloud Functions environment: firebase functions:config:get
→ Check Gemini API key is correct
→ Check Cloud Function deployed: firebase functions:list
→ Check Cloud Function logs: firebase functions:log
```

### "Netlify says 'missing environment variables'"

```
→ Check VITE_ variables are set in Netlify
→ Trigger redeploy: git push
→ Wait 2 minutes for build to complete
```

### "Facebook connection fails"

```
→ Verify FACEBOOK_APP_SECRET is set in Cloud Functions
→ Verify FACEBOOK_APP_ID is in Netlify VITE_ variables
→ Check Facebook OAuth redirect URI is correct
```

---

## TOTAL TIME: ~15 MINUTES

1. Delete variables (2 min)
2. Deploy code (3 min)
3. Set Firebase env (5 min)
4. Deploy functions (3 min)
5. Test (2 min)
6. Verify (1 min)

**Then you're done!** App is fully secure. ✅
