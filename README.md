# 🎯 Market Mind - AI-Powered Social Media Content Generator SaaS

Premium SaaS application for creating, scheduling, and managing social media content across multiple platforms using AI-powered generation and market research.

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** December 29, 2025

---

## 📚 DOCUMENTATION

**👉 [START HERE: DOCUMENTATION.md](DOCUMENTATION.md)**

All information you need is in the main [DOCUMENTATION.md](DOCUMENTATION.md) file. Alternatively, use [INDEX.md](INDEX.md) to find what you're looking for.

### Core Documentation Files

| File                                                   | Purpose                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| **[DOCUMENTATION.md](DOCUMENTATION.md)**               | Complete guide (setup, deployment, features, troubleshooting) |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | Pre-deployment verification checklist                         |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**           | Cheat sheet for common tasks                                  |
| **[COMMANDS.md](COMMANDS.md)**                         | All npm and development commands                              |
| **[ARCHITECTURE.md](ARCHITECTURE.md)**                 | System architecture and diagrams                              |
| **[SECURITY_SUMMARY.md](SECURITY_SUMMARY.md)**         | Security audit and best practices                             |
| **[INDEX.md](INDEX.md)**                               | Documentation index and quick links                           |

---

## 🚀 QUICK START

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# Opens at http://localhost:5173
```

### Deployment to Production

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Netlify auto-deploys (if connected)
# 3. Check deployment status in Netlify dashboard
```

---

## 🔐 Security

**Important:** All environment variables are properly configured. Real secrets have been removed from the repository. See [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) for security audit details and best practices.

# 3. Deploy Cloud Functions

cd functions
firebase deploy --only functions

# 4. Test on https://marketmind-02.netlify.app

```

---

## 💡 KEY FEATURES

✅ **AI Content Generation** - Generate social media posts using Google Gemini API
✅ **Market Research** - Get business insights and trend analysis
✅ **Multiple Platforms** - Connect Facebook, Instagram, TikTok, YouTube, Twitter/X
✅ **Payment Processing** - Paystack integration with 3 subscription tiers
✅ **User Authentication** - Firebase Auth with email/password and Google SSO
✅ **Subscription Tiers** - FREE, PRO (₦9,999/month), ENTERPRISE (custom)
✅ **Usage Tracking** - Monitor monthly limits on posts and research
✅ **Content History** - View and manage all generated content
✅ **Responsive Design** - Works on desktop and mobile

---

## 🏗️ TECH STACK

| Component        | Technology               |
| ---------------- | ------------------------ |
| Frontend         | React 18 + Vite          |
| Styling          | CSS3                     |
| State Management | Context API              |
| Backend          | Firebase Cloud Functions |
| Database         | Firestore                |
| Authentication   | Firebase Auth            |
| Payments         | Paystack                 |
| AI               | Google Gemini API        |
| Hosting          | Netlify                  |

---

## 📁 PROJECT STRUCTURE

```

marketmind-new/
├── src/
│ ├── components/ # Reusable components
│ ├── context/ # Auth state management
│ ├── features/ # Feature modules
│ ├── pages/ # Page components
│ ├── services/ # API & service calls
│ ├── App.jsx # Main app
│ └── main.jsx # Entry point
├── functions/ # Firebase Cloud Functions
├── netlify/ # Netlify serverless functions
├── public/ # Static assets
├── .env.local # Local environment (NOT committed)
├── .env.example # Template for env vars
├── DOCUMENTATION.md # Complete documentation
├── firebase.json # Firebase config
├── firestore.rules # Firestore security
├── vite.config.js # Vite config
└── netlify.toml # Netlify config

```

---

## ⚙️ SETUP CHECKLIST

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Fill in `.env.local` with Firebase credentials
- [ ] Get OAuth credentials from Facebook, YouTube, TikTok
- [ ] Get Paystack keys
- [ ] Get Gemini API key
- [ ] Deploy Cloud Functions: `firebase deploy --only functions`
- [ ] Set Netlify environment variables
- [ ] Trigger Netlify deploy
- [ ] Register OAuth redirect URIs on each platform
- [ ] Test locally: `npm run dev`
- [ ] Test on production

---

## 🔐 SECURITY

- All API secrets stored in Netlify Functions environment (not in code)
- .env.local is never committed to git
- Firestore security rules enforce authentication
- OAuth uses state parameter for CSRF protection
- Passwords hashed by Firebase Auth
- Payment processing through trusted Paystack

---

## 📖 DOCUMENTATION STRUCTURE

| Document                             | Purpose                           |
| ------------------------------------ | --------------------------------- |
| [DOCUMENTATION.md](DOCUMENTATION.md) | **All-in-one guide** (start here) |
| [.env.local](.env.local)             | Environment variables template    |
| [firestore.rules](firestore.rules)   | Firestore security rules          |
| [firebase.json](firebase.json)       | Firebase configuration            |
| [netlify.toml](netlify.toml)         | Netlify build configuration       |

---

## 🤝 CONTRIBUTING

To add new features or fix issues:

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test locally: `npm run dev`
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

---

## 🐛 TROUBLESHOOTING

For common issues and solutions, see [Troubleshooting Section in DOCUMENTATION.md](DOCUMENTATION.md#-troubleshooting)

**Quick Links:**

- App won't load → [Troubleshooting](DOCUMENTATION.md#app-wont-load-npm-run-dev-fails)
- Firebase not connecting → [Firebase Issues](DOCUMENTATION.md#firebase-not-connecting)
- Social media linking fails → [Linking Issues](DOCUMENTATION.md#social-media-linking-fails)
- Content generation fails → [Generation Issues](DOCUMENTATION.md#content-generation-fails)
- Payment doesn't work → [Payment Issues](DOCUMENTATION.md#payment-doesnt-work)

---

## 📞 SUPPORT

- **Documentation:** [DOCUMENTATION.md](DOCUMENTATION.md)
- **Firebase Docs:** https://firebase.google.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vite.dev

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** December 28, 2025

For complete setup and deployment instructions, please refer to [DOCUMENTATION.md](DOCUMENTATION.md)
```
