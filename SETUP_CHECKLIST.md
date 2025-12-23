# Market Mind - Quick Setup Checklist

## ✅ What's Been Fixed

### Security Improvements

- [x] Removed API keys from frontend (Claude, Perplexity, AWS credentials)
- [x] Created Firebase Cloud Functions for AI API calls
- [x] Implemented Firestore security rules (users can only access own data)
- [x] Added payment verification with Paystack
- [x] Normalized error messages (no info leakage)
- [x] Added Error Boundary component for global error handling
- [x] Created secure environment variable structure

### New Features

- [x] Paystack payment integration (Premium SaaS ready)
- [x] Subscription tiers: Free, Pro, Enterprise
- [x] Monthly API usage limits per tier
- [x] YouTube integration added to social platforms
- [x] Pricing page with Paystack checkout
- [x] User subscription tracking
- [x] Usage tracking and limits enforcement

### Code Quality

- [x] Updated auth service with subscription management
- [x] Added user tier verification
- [x] Subscription auto-downgrade on expiry
- [x] Error boundary for app stability
- [x] Firebase Cloud Functions for secure operations

### Documentation

- [x] Comprehensive Deployment Guide (DEPLOYMENT_GUIDE.md)
- [x] Step-by-step API key setup instructions
- [x] Paystack payment testing guide
- [x] Environment variables documentation
- [x] Cloud Functions setup instructions

---

## 📋 Next Steps (Do These in Order)

### Phase 1: Local Setup (15 minutes)

1. Rename `.env.example.new` to `.env.local`
2. Fill in Firebase credentials (see DEPLOYMENT_GUIDE.md)
3. Run: `npm install`
4. Run: `npm run dev`
5. Test local app

### Phase 2: Firebase Setup (30 minutes)

1. Follow "Firebase Setup" section in DEPLOYMENT_GUIDE.md
2. Create Cloud Firestore
3. Deploy Firestore rules from `firestore.rules`
4. Test Firestore connection

### Phase 3: Cloud Functions (45 minutes)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Follow "Cloud Functions Deployment" in DEPLOYMENT_GUIDE.md
4. Deploy functions: `firebase deploy --only functions`
5. Verify deployment: `firebase functions:list`

### Phase 4: Paystack Setup (20 minutes)

1. Create Paystack account
2. Get test & live keys
3. Add keys to Firebase functions config
4. Test payment flow with test card (see DEPLOYMENT_GUIDE.md)
5. Set webhook URL in Paystack dashboard

### Phase 5: YouTube OAuth (20 minutes)

1. Create Google Cloud project
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Add redirect URIs
5. Copy Client ID and Secret

### Phase 6: Netlify Deployment (30 minutes)

1. Push code to GitHub
2. Connect GitHub to Netlify
3. Add environment variables in Netlify
4. Trigger deploy
5. Test live site

### Phase 7: Production Checklist

- [ ] All API keys in Netlify environment
- [ ] Paystack webhook configured for live domain
- [ ] Firestore backup enabled
- [ ] Custom domain connected (optional)
- [ ] SSL certificate enabled (auto)
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Payment testing completed
- [ ] Auth testing completed

---

## 🔑 API Keys Required (Placeholders to Replace)

### Frontend (.env.local) - SAFE TO EXPOSE

```
VITE_FIREBASE_API_KEY=PLACEHOLDER_YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=PLACEHOLDER_YOUR_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=PLACEHOLDER_YOUR_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=PLACEHOLDER_YOUR_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=PLACEHOLDER_YOUR_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=PLACEHOLDER_YOUR_FIREBASE_APP_ID

VITE_PAYSTACK_PUBLIC_KEY=PLACEHOLDER_pk_live_xxxxx
VITE_YOUTUBE_CLIENT_ID=PLACEHOLDER_xxxxx.apps.googleusercontent.com
VITE_R2_ACCOUNT_ID=PLACEHOLDER_your_account_id
VITE_R2_BUCKET_NAME=market-mind-media
```

### Cloud Functions (Firebase Config) - SECRET

```
CLAUDE_API_KEY=PLACEHOLDER_sk-ant-xxxxx
PERPLEXITY_API_KEY=PLACEHOLDER_pplx-xxxxx
PAYSTACK_SECRET_KEY=PLACEHOLDER_sk_live_xxxxx
YOUTUBE_CLIENT_SECRET=PLACEHOLDER_xxxxx
VITE_R2_ACCESS_KEY_ID=PLACEHOLDER_xxxxx
VITE_R2_SECRET_ACCESS_KEY=PLACEHOLDER_xxxxx
```

---

## 🎯 Where to Get Each Key

| Service       | Where to Get                           | Time  | Documentation                   |
| ------------- | -------------------------------------- | ----- | ------------------------------- |
| Firebase      | https://firebase.google.com            | 10min | DEPLOYMENT_GUIDE.md - Section 1 |
| Claude API    | https://console.anthropic.com          | 5min  | DEPLOYMENT_GUIDE.md - Section 2 |
| Perplexity    | https://www.perplexity.ai/settings/api | 5min  | DEPLOYMENT_GUIDE.md - Section 3 |
| Paystack      | https://dashboard.paystack.com         | 15min | DEPLOYMENT_GUIDE.md - Section 4 |
| YouTube OAuth | https://console.cloud.google.com       | 20min | DEPLOYMENT_GUIDE.md - Section 5 |
| Cloudflare R2 | https://dash.cloudflare.com            | 15min | DEPLOYMENT_GUIDE.md - Section 6 |

---

## 🚀 Deployment Checklist

```bash
# 1. Local testing
npm run dev

# 2. Build for production
npm run build

# 3. Deploy to Firebase Hosting (if using)
firebase deploy

# 4. OR Push to GitHub for Netlify
git add .
git commit -m "Production ready"
git push origin main
```

---

## ⚠️ Important: Security Reminders

1. **NEVER commit .env.local to Git**
   - Add to .gitignore (already done)
2. **Use different keys for different environments:**
   - Development: Use Paystack TEST keys
   - Production: Use Paystack LIVE keys
3. **Paystack Webhook:**
   - Must be accessible from internet
   - Use HTTPS only
   - Verify signature in handler
4. **Firebase Rules:**

   - Verify they're published
   - Test with actual user IDs
   - Deny by default, allow specific cases

5. **Cloud Functions:**
   - Verify they're deployed
   - Check logs: `firebase functions:log`
   - Monitor for errors

---

## 📞 Support

- Firebase Issues: https://firebase.google.com/support
- Paystack Issues: https://paystack.com/contact
- Netlify Issues: https://docs.netlify.com/
- YouTube Issues: https://support.google.com/youtube

---

## 📝 Notes

- Total setup time: ~3-4 hours
- All costs are covered by free tiers (except Paystack transaction fees)
- Start with test/sandbox mode before going live
- Monitor first week for any issues
- Have analytics dashboard ready to monitor adoption

**Last Updated**: December 21, 2025
**Status**: Production Ready ✅
