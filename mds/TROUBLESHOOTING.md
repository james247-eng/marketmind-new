# Market Mind - Troubleshooting Guide

## 🆘 Common Issues & Solutions

---

## 1. "Module not found: firebase-functions"

### Symptoms

```
Error: Cannot find module 'firebase-functions'
```

### Solution

```bash
cd functions
npm install firebase-functions firebase-admin @anthropic-ai/sdk axios
npm install --save-dev firebase-functions-test
```

---

## 2. "PERMISSION_DENIED: Missing or insufficient permissions"

### Symptoms

- Can't read/write data in Firestore
- Error in Firestore when testing

### Cause

Firestore security rules not published

### Solution

1. Go to Firebase Console
2. Click "Firestore Database"
3. Go to "Rules" tab
4. Copy content from `firestore.rules`
5. Paste into Firebase rules editor
6. Click "Publish"
7. Reload app and test

---

## 3. "API Key not found" or "undefined"

### Symptoms

```
Error: VITE_FIREBASE_API_KEY is undefined
```

### Cause

Environment variables not set

### Solution

**For Local Development:**

```bash
1. Create .env.local (copy from .env.example)
2. Fill in all PLACEHOLDER values
3. Restart dev server: npm run dev
```

**For Netlify:**

1. Go to Site settings > Build & deploy > Environment
2. Click "Edit variables"
3. Add all VITE\_\* variables
4. Save
5. Trigger new deploy

---

## 4. "Payment Failed" Error

### Symptoms

- Paystack payment page shows error
- Payment not processed
- No confirmation email

### Possible Causes

**A. Wrong API Key**

```bash
# Verify in Netlify:
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx (MUST start with pk_)
```

**B. Webhook URL Wrong**

- Go to Paystack Dashboard > Settings > API Webhooks
- Verify URL: `https://your-domain/.netlify/functions/paystackWebhook`
- Must be HTTPS
- Must be accessible

**C. Using Test Key in Production**

```bash
# Should NOT have "test" in key names
❌ pk_test_xxxxx (test mode)
✅ pk_live_xxxxx (production)
```

### Solution

1. Verify keys in Netlify environment
2. Verify webhook URL is correct
3. Use test keys if testing
4. Use live keys if live
5. Reload page and try again

---

## 5. "Cloud Function Deploy Failed"

### Symptoms

```
Error: Failed to deploy functions
```

### Cause

- Not logged in to Firebase
- Wrong project selected
- Syntax error in functions code

### Solution

```bash
# 1. Login
firebase login

# 2. Check project
firebase projects:list
firebase use YOUR_PROJECT_ID

# 3. Check syntax
cd functions
npm run lint

# 4. Deploy
firebase deploy --only functions

# 5. Check status
firebase functions:list
firebase functions:log
```

---

## 6. "Firestore: RESOURCE_EXHAUSTED"

### Symptoms

```
Error: RESOURCE_EXHAUSTED: Quota exceeded
```

### Cause

- Free tier quota exceeded
- Too many API calls
- Inefficient database queries

### Solution

```bash
# Check usage
firebase functions:log

# Optimize queries:
# 1. Add indexes
# 2. Use pagination
# 3. Cache results
# 4. Upgrade plan if needed

# Upgrade in Firebase Console:
# Firestore > Settings > Billing plan
```

---

## 7. "AuthError: auth/user-not-found"

### Symptoms

- Can't log in
- Email says "not registered"
- Just signed up but can't log in

### Cause

- User not created yet
- Wrong email/password
- Case-sensitive email

### Solution

1. Try signing up with same email
2. Check if email is correct (case-sensitive)
3. Reset password if forgot
4. Check Firebase Auth console for user

---

## 8. "YouTube OAuth Redirect Error"

### Symptoms

```
Error: redirect_uri_mismatch
The redirect URI does not match the one authorized for this application
```

### Cause

Redirect URI not configured in Google Cloud Console

### Solution

1. Go to Google Cloud Console
2. Go to APIs & Services > Credentials
3. Click OAuth 2.0 Client ID
4. Add Authorized redirect URIs:
   ```
   http://localhost:5173/auth/youtube/callback
   https://your-netlify-domain/auth/youtube/callback
   ```
5. Save
6. Reload page

---

## 9. "R2 Upload Failed"

### Symptoms

- File upload returns error
- No file in R2 bucket
- "403 Forbidden" error

### Cause

- R2 credentials wrong
- R2 bucket not created
- Permissions not set

### Solution

1. Verify R2 bucket exists
2. Verify credentials in Cloud Functions:
   ```bash
   firebase functions:config:get
   ```
3. Verify Access Key ID and Secret
4. Check R2 permissions in Cloudflare
5. Re-upload with correct credentials

---

## 10. "Paystack Webhook Not Triggering"

### Symptoms

- Payment completes but subscription not updated
- No database record created
- Webhook shows as undelivered

### Cause

- Webhook URL inaccessible
- Webhook signature verification failed
- Function returning error

### Solution

```bash
# 1. Check webhook URL
# In Paystack Dashboard > Settings > API Webhooks
# URL should be: https://your-domain/.netlify/functions/paystackWebhook

# 2. Check function logs
firebase functions:log

# 3. Verify signature validation
# Webhook handler should verify x-paystack-signature header

# 4. Test webhook manually
curl -X POST https://your-domain/.netlify/functions/paystackWebhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test" \
  -d '{"event":"charge.success"}'
```

---

## 11. "Claude API: 401 Unauthorized"

### Symptoms

```
Error: 401 - Unauthorized
```

### Cause

- Wrong API key
- API key expired
- API key not set in Cloud Functions

### Solution

```bash
# 1. Verify API key is valid
# Go to https://console.anthropic.com/account/api-keys

# 2. Set in Cloud Functions
firebase functions:config:set claude.api_key="sk-ant-xxxxx"

# 3. Verify it's set
firebase functions:config:get

# 4. Deploy again
firebase deploy --only functions
```

---

## 12. "Insufficient Permissions to Deploy"

### Symptoms

```
Error: Permission denied: insufficient roles
```

### Cause

- Not project owner
- Firebase service account needs permissions

### Solution

1. Go to Firebase Console
2. Go to Project settings > Service accounts
3. Click "Generate new private key"
4. Save JSON file
5. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
   ```
6. Try deploy again

---

## 13. "Build Failed on Netlify"

### Symptoms

- Netlify deploy shows error
- Build log shows failure
- No error details

### Solution

1. Check build log in detail:
   - Go to Netlify > Deploys > Click failed deploy > View build log
2. Common causes:
   - Missing environment variable
   - Node version mismatch
   - Dependency issue
3. Check `functions/package.json` syntax
4. Try local build:
   ```bash
   npm run build
   ```
5. If local works but Netlify fails:
   - Verify all env vars in Netlify
   - Clear cache: Netlify > Site settings > Build & deploy > Clear cache & retry

---

## 14. "Stripe/Paystack Import Error"

### Symptoms

```
Error: Cannot find module 'stripe' or 'paystack'
```

### Solution

The app uses Paystack, not Stripe. Make sure:

```bash
# In functions/package.json - NO stripe
# Only Paystack via axios

npm install --no-save stripe  # Remove if installed
```

---

## 15. "Vite Compilation Error"

### Symptoms

- Blank page in browser
- Red errors in console
- "SyntaxError" in build log

### Solution

```bash
# 1. Clear everything
rm -rf node_modules dist
npm install

# 2. Check for syntax errors
npm run lint

# 3. Start dev server
npm run dev

# 4. Check browser console for errors
# Ctrl+Shift+J (Chrome) or F12
```

---

## 🔍 How to Debug

### Check Logs

**Cloud Functions:**

```bash
firebase functions:log
firebase functions:log --limit 50  # Last 50 entries
```

**Browser Console:**

```
Ctrl+Shift+J (Windows/Linux)
Cmd+Option+J (Mac)
```

**Netlify Build:**

- Go to Netlify Dashboard
- Click site
- Go to Deploys
- Click failed/latest deploy
- View "Logs" tab

**Paystack:**

- Go to Paystack Dashboard
- Go to Transactions
- View detailed logs for each transaction

### Network Inspector

```
F12 > Network tab
- Check API calls
- Verify response codes
- See error responses
```

### Firebase Console

```
1. Go to Firebase Console
2. Click your project
3. Check:
   - Firestore > Data (view database)
   - Authentication > Users (check registered users)
   - Hosting > Deploys (if using Firebase hosting)
   - Functions > Execution logs
```

---

## 🆘 If Nothing Works

### Step 1: Collect Information

```
- What exactly did you try?
- What error message appears?
- What did you expect to happen?
- When did this last work?
```

### Step 2: Search Documentation

1. Check DEPLOYMENT_GUIDE.md
2. Check QUICK_REFERENCE.md
3. Check Firebase docs: https://firebase.google.com/docs
4. Check Paystack docs: https://paystack.com/docs

### Step 3: Isolate Problem

```bash
# Test each component separately:

# Test Firebase connection
firebase projects:list

# Test Cloud Functions
firebase functions:list

# Test local build
npm run build

# Test authentication
# Try signing up fresh user
```

### Step 4: Get Help

1. **Firebase**: https://firebase.google.com/support
2. **Paystack**: https://paystack.com/support
3. **Netlify**: https://docs.netlify.com/
4. **React**: https://react.dev/
5. **Stack Overflow**: Tag questions with [firebase], [paystack], [netlify]

---

## ✅ Verification Checklist

After setup, verify each piece works:

```bash
# ✅ 1. Firebase Connection
firebase projects:list

# ✅ 2. Cloud Functions Deployed
firebase functions:list

# ✅ 3. Local Dev Server
npm run dev
# Visit http://localhost:5173

# ✅ 4. Can Sign Up
# Create test account

# ✅ 5. Can Log In
# Log in with test account

# ✅ 6. Pricing Page Loads
# Go to /pricing

# ✅ 7. Can Upgrade (test)
# Use Paystack test card

# ✅ 8. Database Updated
# Check Firestore

# ✅ 9. Build Production
npm run build

# ✅ 10. Deploy to Netlify
# Via GitHub integration
```

---

**Last Updated**: December 21, 2025
**Version**: 1.0
**Status**: ✅ Complete
