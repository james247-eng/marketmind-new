# Market Mind - Production Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy Market Mind as a premium SaaS on Netlify with Firebase backend and Paystack payments.

---

## Table of Contents

1. [API Key Setup](#api-key-setup)
2. [Firebase Configuration](#firebase-configuration)
3. [Cloud Functions Deployment](#cloud-functions-deployment)
4. [Netlify Deployment](#netlify-deployment)
5. [Environment Variables](#environment-variables)
6. [Testing Payments](#testing-payments)

---

## API Key Setup

### 1. Firebase Setup (Required)

**Time: 10 minutes**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a Project"
3. Name: `market-mind`
4. Enable Google Analytics (optional)
5. Once created, go to "Project Settings" > "General"
6. Scroll to "Your apps" > "Web"
7. Copy the config object:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

**Paste into `.env.local`:**

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

**Enable Required Services:**

- Go to "Build" > "Authentication"
- Click "Get Started"
- Enable: Email/Password, Google, Anonymous
- Go to "Firestore Database"
- Click "Create database" > "Start in production mode"
- Click "Create database"

### 2. Claude API Key (Required)

**Time: 5 minutes**

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Click "API keys" > "Create Key"
3. Name it `market-mind`
4. Copy the key

**For Netlify Functions environment:**

```
CLAUDE_API_KEY=sk-ant-xxxxx
```

### 3. Perplexity API Key (Required)

**Time: 5 minutes**

1. Go to [Perplexity Settings](https://www.perplexity.ai/settings/api)
2. Click "Create new API key"
3. Copy the key

**For Netlify Functions environment:**

```
PERPLEXITY_API_KEY=pplx-xxxxx
```

### 4. Paystack Payment Gateway (Required)

**Time: 15 minutes**

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Sign up / Log in
3. Go to "Settings" > "Developers"
4. Get:
   - **Public Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

**For Frontend (.env.local):**

```
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
```

**For Cloud Functions (.env in functions folder):**

```
PAYSTACK_SECRET_KEY=sk_live_xxxxx
```

**Enable Paystack Webhook:**

- Go to "Settings" > "API Webhooks"
- Add Webhook URL: `https://your-netlify-domain/.netlify/functions/paystackWebhook`
- Select events: `charge.success`

### 5. YouTube OAuth Integration (Recommended)

**Time: 20 minutes**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Market Mind"
3. Go to "APIs & Services" > "Library"
4. Search "YouTube Data API v3"
5. Click "Enable"
6. Go to "APIs & Services" > "Credentials"
7. Click "Create Credentials" > "OAuth 2.0 Client ID"
8. Choose "Web Application"
9. Authorized redirect URIs:
   ```
   http://localhost:5173/auth/youtube/callback
   https://your-netlify-domain/auth/youtube/callback
   ```
10. Download JSON and copy:
    - **Client ID**
    - **Client Secret**

**For .env.local:**

```
VITE_YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

**For Cloud Functions:**

```
YOUTUBE_CLIENT_SECRET=xxxxx
```

### 6. Cloudflare R2 Storage (Recommended)

**Time: 15 minutes**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to "R2" > "Create Bucket"
3. Name: `market-mind-media`
4. Go to "Account" > "API Tokens" > "Create API Token"
5. Choose "Edit Cloudflare Workers" template
6. Copy:
   - **Account ID** (visible in R2 settings)
   - **API Token**

**For .env.local:**

```
VITE_R2_ACCOUNT_ID=your_account_id
VITE_R2_BUCKET_NAME=market-mind-media
```

**For Cloud Functions:**

```
VITE_R2_ACCESS_KEY_ID=xxxxx
VITE_R2_SECRET_ACCESS_KEY=xxxxx
```

---

## Firebase Configuration

### Setup Firestore Rules

1. Go to Firebase Console > "Firestore Database" > "Rules"
2. Replace the default rules with content from `firestore.rules`
3. Click "Publish"

### Setup Realtime Indexes (if needed)

1. Go to "Firestore Database" > "Indexes"
2. Create composite indexes for queries (will be prompted automatically)

---

## Cloud Functions Deployment

### Prerequisites

```bash
npm install -g firebase-tools
firebase login
```

### Deploy Functions

1. Create `functions` folder if not exists:

```bash
firebase init functions
# Choose: Use existing project
# Choose: JavaScript
# Install dependencies: Yes
```

2. Copy contents of `functions/index.js` and `functions/paystack.js` to:

   ```
   functions/index.js
   functions/paystack.js
   ```

3. Install dependencies:

```bash
cd functions
npm install firebase-admin firebase-functions @anthropic-ai/sdk axios
npm install --save-dev firebase-functions-test
```

4. Set environment variables:

```bash
firebase functions:config:set claude.api_key="sk-ant-xxxxx"
firebase functions:config:set perplexity.api_key="pplx-xxxxx"
firebase functions:config:set paystack.secret_key="sk_live_xxxxx"
firebase functions:config:set youtube.client_secret="xxxxx"
```

5. Deploy:

```bash
firebase deploy --only functions
```

Check deployment status:

```bash
firebase functions:list
```

---

## Netlify Deployment

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Market Mind SaaS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/market-mind.git
git push -u origin main
```

### Step 2: Connect to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" > "Import an existing project"
3. Choose GitHub
4. Search `market-mind`
5. Click "Deploy"

### Step 3: Set Environment Variables in Netlify

1. Go to "Site settings" > "Build & deploy" > "Environment"
2. Click "Edit variables"
3. Add all frontend variables from `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
VITE_YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_R2_ACCOUNT_ID=xxxxx
VITE_R2_BUCKET_NAME=market-mind-media
```

4. Click "Save"

### Step 4: Trigger Deploy

1. Go to "Deployments"
2. Click "Trigger deploy" > "Deploy site"
3. Wait for build to complete
4. Your site URL: `https://your-site-name.netlify.app`

---

## Environment Variables

### Frontend Variables (.env.local)

These are safe to expose and are prefixed with `VITE_`:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Public Keys Only
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
VITE_YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_R2_ACCOUNT_ID=xxxxx
VITE_R2_BUCKET_NAME=market-mind-media
```

### Cloud Functions Variables (Firebase)

Set using Firebase CLI (secret keys):

```bash
firebase functions:config:set \
  claude.api_key="sk-ant-xxxxx" \
  perplexity.api_key="pplx-xxxxx" \
  paystack.secret_key="sk_live_xxxxx"
```

---

## Testing Payments

### Test Mode (Sandbox)

1. Use Paystack **TEST keys**:

   - Public: `pk_test_xxxxx`
   - Secret: `sk_test_xxxxx`

2. Test card numbers:
   - **Visa**: 4123450131001381
   - **Mastercard**: 5531886652142950
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date

### Production Mode

1. Switch to **LIVE keys**:

   - Public: `pk_live_xxxxx`
   - Secret: `sk_live_xxxxx`

2. Test with real payments (will be refundable)

### Verify Webhook

Test webhook delivery:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/paystackWebhook \
  -H "x-paystack-signature: SIGNATURE" \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{"reference":"random_string"}}'
```

---

## Production Checklist

- [ ] All API keys configured in Netlify
- [ ] Firestore security rules published
- [ ] Cloud Functions deployed and tested
- [ ] Paystack webhook configured
- [ ] Custom domain connected (optional)
- [ ] SSL certificate enabled (auto with Netlify)
- [ ] Analytics set up (optional)
- [ ] Error monitoring enabled (optional)
- [ ] Backup strategy in place
- [ ] Legal: Privacy policy & Terms of service pages created

---

## Monitoring & Maintenance

### Cloud Functions Monitoring

```bash
firebase functions:log
```

### Firebase Metrics

- Go to Firebase Console > "Analytics"
- Monitor: User growth, engagement, errors

### Netlify Analytics

- Go to Netlify > "Analytics"
- Monitor: Build time, requests, bandwidth

---

## Troubleshooting

### "API Key not found" Error

- Verify key is in Netlify environment variables
- Restart build: Trigger deploy again
- Check variable names match exactly

### "Payment Failed" Error

- Verify Paystack keys are correct
- Check webhook URL is accessible
- Review Paystack logs for details

### "Firebase Permission Denied"

- Check Firestore rules are published
- Verify user is authenticated
- Check `userId` matches request

---

## Support & Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Paystack API](https://paystack.com/docs/api/)
- [Netlify Docs](https://docs.netlify.com/)
- [Claude API](https://docs.anthropic.com/)
- [YouTube Data API](https://developers.google.com/youtube/v3)

---

**Last Updated**: December 21, 2025
**Version**: 1.0 (Production Ready)
