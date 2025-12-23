# Market Mind - Quick Reference Card

## 🎯 Project Overview

- **Type**: Premium SaaS AI Marketing Assistant
- **Backend**: Firebase (Firestore + Cloud Functions)
- **Frontend**: React 19 + Vite
- **Hosting**: Netlify
- **Payments**: Paystack
- **Status**: ✅ Production Ready

---

## 📂 Project Structure

```
market-mind/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ErrorBoundary.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx  # User auth state
│   ├── features/            # Feature pages
│   │   ├── auth/            # Login, Signup
│   │   ├── business/        # Business management
│   │   ├── content/         # Content generation
│   │   ├── pricing/         # Pricing page
│   │   ├── scheduling/      # Post scheduling
│   │   ├── social/          # Social accounts
│   │   └── settings/        # User settings
│   ├── services/
│   │   ├── firebase.js      # Firebase config
│   │   ├── authService.js   # Auth operations
│   │   ├── aiService.js     # AI API calls
│   │   ├── storageService.js# R2 uploads
│   │   └── contentService.js# Content DB
│   ├── App.jsx              # Main app with routing
│   └── App.css
├── functions/               # Firebase Cloud Functions
│   ├── index.js             # AI functions
│   ├── paystack.js          # Payment functions
│   └── package.json
├── firestore.rules          # Security rules
├── firebase.json            # Firebase config
├── DEPLOYMENT_GUIDE.md      # Full setup guide
├── SETUP_CHECKLIST.md       # Quick checklist
└── .env.example.new         # Environment variables
```

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview build locally
npm run preview

# Deploy Cloud Functions
firebase deploy --only functions

# View Cloud Function logs
firebase functions:log

# Deploy everything to Firebase
firebase deploy
```

---

## 💳 Subscription Tiers

| Feature            | Free      | Pro       | Enterprise |
| ------------------ | --------- | --------- | ---------- |
| **Price**          | ₦0        | ₦9,999/mo | ₦29,999/mo |
| **Posts/Month**    | 10        | 100       | Unlimited  |
| **Research/Month** | 5         | 50        | Unlimited  |
| **Businesses**     | 1         | Unlimited | Unlimited  |
| **Scheduling**     | ❌        | ✅        | ✅         |
| **YouTube**        | ❌        | ✅        | ✅         |
| **Support**        | Community | Priority  | Dedicated  |

---

## 🔐 Security Architecture

```
Frontend (React)
  ├─ No API keys exposed
  ├─ No AWS credentials
  └─ Calls Cloud Functions only
         ↓
Cloud Functions (Node.js)
  ├─ All API keys here
  ├─ Validates user tier
  ├─ Rate limiting
  ├─ Payment verification
  └─ Secure operations
         ↓
External APIs
  ├─ Claude (content)
  ├─ Perplexity (research)
  ├─ Paystack (payments)
  ├─ YouTube (scheduling)
  └─ Cloudflare R2 (storage)
```

---

## 📊 Data Flow

### Content Generation

```
User → Frontend → Cloud Function → Claude API → Response → Save to Firestore → Display
```

### Payment Processing

```
User → Pricing Page → Paystack Payment Form → Verification → Update Subscription → Success
```

### Post Scheduling

```
Business Profile → Content Generator → Schedule Form → Firestore → Cron Job → Social APIs
```

---

## 🚀 Deployment Steps

### Quick Start (5 minutes)

```bash
1. Copy .env.example.new to .env.local
2. Fill in Firebase credentials
3. npm install && npm run dev
```

### Production Deployment (1-2 hours)

```bash
1. Complete API key setup (see DEPLOYMENT_GUIDE.md)
2. Deploy Cloud Functions: firebase deploy --only functions
3. Push to GitHub
4. Connect GitHub to Netlify
5. Add environment variables in Netlify
6. Trigger deploy
```

---

## 🔑 API Keys Checklist

**Providers needing account:**

- [ ] Firebase (https://firebase.google.com)
- [ ] Anthropic Claude (https://console.anthropic.com)
- [ ] Perplexity (https://www.perplexity.ai)
- [ ] Paystack (https://paystack.com)
- [ ] Google Cloud (https://console.cloud.google.com) - for YouTube
- [ ] Cloudflare (https://dash.cloudflare.com) - for R2 storage

**Total setup time:** ~2-3 hours

---

## ⚡ Performance Optimization

```javascript
// Already implemented:
✅ Code splitting (Vite)
✅ Image optimization (R2)
✅ Lazy loading (React.lazy)
✅ Database indexing (Firestore)
✅ Caching (Firebase hosting)
✅ CDN (Netlify edge)
```

---

## 📱 Responsive Design

```
✅ Desktop (1920px+)
✅ Tablet (768px+)
✅ Mobile (320px+)
✅ Touch-friendly buttons
✅ Mobile sidebar menu
```

---

## 🧪 Testing

### Before Deploy

```bash
1. Test auth (sign up, login, Google)
2. Test content generation
3. Test payment flow (use Paystack test keys)
4. Test subscription tier limits
5. Test error boundary
```

### Payment Testing

```
Test Card: 4123450131001381
CVV: Any 3 digits
Expiry: Any future date
Amount: Will show in Paystack sandbox
```

---

## 🔍 Firestore Database Schema

```
users/
  ├── {userId}
  │   ├── email
  │   ├── displayName
  │   ├── subscriptionTier (free/pro/enterprise)
  │   ├── subscriptionEnd (expiry date)
  │   └── createdAt

businesses/
  ├── {businessId}
  │   ├── userId
  │   ├── name
  │   ├── niche
  │   ├── description
  │   └── createdAt

content/
  ├── {contentId}
  │   ├── userId
  │   ├── businessId
  │   ├── type (generated/research)
  │   ├── content
  │   └── createdAt

subscriptions/
  ├── {subscriptionId}
  │   ├── userId
  │   ├── tier
  │   ├── status (active/expired)
  │   └── endDate

payments/
  ├── {paymentId}
  │   ├── userId
  │   ├── amount
  │   ├── status
  │   ├── reference
  │   └── createdAt
```

---

## 🆘 Troubleshooting

| Problem                 | Solution                               |
| ----------------------- | -------------------------------------- |
| "API key not found"     | Check .env.local & Netlify env vars    |
| "Permission denied"     | Verify Firestore rules are published   |
| "Payment failed"        | Check Paystack keys & webhook URL      |
| "Function not deployed" | Run `firebase deploy --only functions` |
| "Blank page"            | Check browser console for errors       |
| "Rate limit exceeded"   | User tier limit reached - upgrade      |

---

## 📞 Support Resources

- **Firebase**: https://firebase.google.com/support
- **Paystack**: https://paystack.com/support
- **Netlify**: https://docs.netlify.com/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/

---

## ✅ Checklist Before Going Live

- [ ] All API keys configured in Netlify
- [ ] Paystack webhook URL set
- [ ] Firestore rules published
- [ ] Cloud Functions deployed & tested
- [ ] Payment testing completed (test + live)
- [ ] Auth testing completed
- [ ] Error boundary working
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] Backup strategy in place
- [ ] Monitoring enabled (optional)
- [ ] Custom domain configured (optional)

---

## 💡 Tips for Premium SaaS Success

1. **User Onboarding**: Welcome email with features overview
2. **Trial Period**: Consider 7-day free trial for Pro tier
3. **Upgrade Prompt**: Show upgrade offer when users hit limits
4. **Customer Support**: Add email support for Enterprise tier
5. **Analytics**: Track user behavior to improve features
6. **Updates**: Regular feature updates keep users engaged
7. **Community**: Consider Discord/Slack community for networking

---

**Document Version**: 1.0
**Last Updated**: December 21, 2025
**Status**: ✅ Production Ready
