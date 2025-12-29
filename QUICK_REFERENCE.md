# 🚀 QUICK REFERENCE GUIDE

**For developers who just want the essentials**

---

## ⚡ 30-SECOND START

```bash
npm install                    # Install dependencies
cp .env.example .env.local     # Copy env template
# Edit .env.local with your values
npm run dev                    # Start dev server
# Open http://localhost:5173
```

---

## 📚 WHERE TO FIND THINGS

| Question                        | Answer                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| How do I set up locally?        | [DOCUMENTATION.md](DOCUMENTATION.md#quick-start)                                                 |
| What are environment variables? | [.env.local](.env.local) (template with comments)                                                |
| How do I deploy?                | [DOCUMENTATION.md](DOCUMENTATION.md#deployment-guide)                                            |
| What's not working?             | [DOCUMENTATION.md](DOCUMENTATION.md#-troubleshooting)                                            |
| What needs to be tested?        | [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)                                               |
| Why didn't social linking work? | [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md#-critical-why-social-media-linking-didnt-work) |
| What APIs do I need?            | [DOCUMENTATION.md](DOCUMENTATION.md#step-1-get-all-credentials)                                  |
| How do payments work?           | [DOCUMENTATION.md](DOCUMENTATION.md#-payment-processing)                                         |
| How does OAuth work?            | [DOCUMENTATION.md](DOCUMENTATION.md#-social-media-integration)                                   |
| Where are my secrets stored?    | Netlify Environment Variables (NOT in code!)                                                     |

---

## 🔧 COMMON COMMANDS

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Check code quality
npm run preview               # Preview production build

# Firebase/Functions
firebase login                # Log in to Firebase
firebase functions:log        # View function logs
firebase deploy --only functions  # Deploy Cloud Functions
firebase functions:config:get # View function config

# Git
git status                     # Check what changed
git add .                      # Stage all changes
git commit -m "message"        # Commit changes
git push origin main          # Push to GitHub
```

---

## 🌍 DEPLOYMENT STEPS (Quick Version)

```
1. Fill .env.local with API keys
2. Test locally: npm run dev
3. Deploy functions: firebase deploy --only functions
4. Push to GitHub: git push origin main
5. Netlify auto-deploys
6. Add env vars to Netlify Dashboard
7. Trigger Netlify deploy
8. Test on https://marketmind-02.netlify.app
```

⚠️ **Critical:** After setting Netlify env vars, **MUST trigger deploy** before testing!

---

## 🔑 ENVIRONMENT VARIABLES AT A GLANCE

### Public (VITE\_ prefix - embedded in frontend)

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

### Secret (No prefix - backend only)

```
GEMINI_API_KEY
FACEBOOK_APP_SECRET
YOUTUBE_CLIENT_SECRET
TIKTOK_CLIENT_SECRET
TWITTER_API_SECRET
PAYSTACK_SECRET_KEY
```

---

## 🐛 QUICK FIXES

| Problem                    | Solution                                                              |
| -------------------------- | --------------------------------------------------------------------- |
| "Cannot find module"       | `npm install`                                                         |
| "VITE\_ undefined"         | Check .env.local has values                                           |
| "Firebase error"           | Check API keys are correct                                            |
| "OAuth failed"             | Check: 1) Env vars set 2) Deploy triggered 3) Redirect URI registered |
| "Content generation fails" | Check GEMINI_API_KEY set in Cloud Functions                           |
| "Payment doesn't open"     | Check VITE_PAYSTACK_PUBLIC_KEY in Netlify                             |
| "Port 5173 in use"         | `npm run dev -- --port 3000`                                          |

---

## 📱 FILE STRUCTURE

```
src/
├── App.jsx              # Main router
├── main.jsx             # Entry point
├── components/          # Reusable components
├── context/             # Auth state
├── features/            # Feature modules
├── pages/               # Pages
├── services/            # API calls
└── utils/               # Helper functions

functions/
├── index.js            # Cloud Functions (AI, etc)
├── oauthExchange.js    # OAuth handling
└── paystack.js         # Payments

netlify/functions/
└── oauth-exchange.js   # Netlify serverless OAuth
```

---

## 🔐 SECURITY RULES

**DO:**

- Keep .env.local locally only
- Add .env.local to .gitignore
- Store secrets in Netlify/Cloud Functions
- Use VITE\_ prefix for public values only
- Validate user input
- Check auth before sensitive operations

**DON'T:**

- Commit .env.local to git
- Put secrets in any VITE\_ variable
- Log sensitive data to console
- Expose API keys in frontend code
- Trust user input without validation
- Store tokens unencrypted

---

## 📊 API ENDPOINTS

### Callable Functions (Frontend)

```
generateContent(prompt, tone, businessContext)
conductResearch(topic, businessNiche)
initializePayment(tier, email, amount)
```

### REST Endpoints

```
POST /.netlify/functions/oauth-exchange
  Body: { platform, code, redirectUri, userId }
```

---

## 🧪 QUICK TEST CHECKLIST

```
□ npm run dev works
□ Can sign up
□ Can sign in
□ Can go to /generate
□ Can click "Generate Content"
□ Can go to /accounts
□ Can click "Connect Facebook"
□ Can go to /pricing
□ Can see payment form
□ No console errors
□ Responsive on mobile
```

---

## 🚨 IF YOU'RE STUCK

1. **Read [DOCUMENTATION.md](DOCUMENTATION.md)**

   - It has answers to most questions
   - Use Ctrl+F to search

2. **Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

   - Detailed explanations of what can go wrong
   - How to fix each issue

3. **Check browser console**

   - Right-click → Inspect → Console tab
   - Read error messages carefully

4. **Check Firebase logs**

   ```bash
   firebase functions:log
   ```

5. **Check Netlify logs**
   - Netlify Dashboard → Functions → View logs

---

## 💡 KEY CONCEPTS

### Environment Variables

Variables that change between dev/production. Set in `.env.local` (dev) or Netlify (production).

### OAuth

Let users sign in with Facebook/Google/etc without sharing passwords.

### Cloud Functions

Code that runs on Google's servers (not in browser). Used for secure operations.

### Netlify Functions

Similar to Cloud Functions but run on Netlify's servers. Used for OAuth token exchange.

### Firestore

NoSQL database. Stores user data, posts, connections.

### Paystack

Payment processor. Handles credit card charges.

---

## 📞 COMMON QUESTIONS

**Q: When do I need to trigger Netlify deploy?**
A: Whenever you change Netlify environment variables. Not for code changes (auto-deployed on git push).

**Q: Where are user secrets stored?**
A: Firestore database in `/users/{userId}/socialConnections/{platform}`

**Q: Can I use a different domain?**
A: Yes, but update OAuth redirect URIs on each platform.

**Q: How do I switch from test to production?**
A: Change `pk_test_` to `pk_live_` in VITE_PAYSTACK_PUBLIC_KEY and redeploy.

**Q: How many users can the app support?**
A: Firestore free tier: 50,000 reads/day. Upgrade to Blaze plan for unlimited.

---

## 🔗 USEFUL LINKS

- [Firebase Console](https://console.firebase.google.com)
- [Netlify Dashboard](https://app.netlify.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Paystack Dashboard](https://dashboard.paystack.com)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)

---

**For complete information:** Read [DOCUMENTATION.md](DOCUMENTATION.md)  
**For deployment:** Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)  
**For project overview:** See [README.md](README.md)
