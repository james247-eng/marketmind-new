# Environment Variables & Netlify Secrets Scanning Guide

## The Problem You're Facing

Your Netlify deployment is failing because:

1. **Vite embeds ALL `VITE_*` variables into the build bundle at compile time**
2. **Netlify's secrets scanner scans the compiled JavaScript** and detects those values
3. **It flags them as "exposed secrets"** and fails the build

This happens **locally it works fine** because:

- Your `.env.local` exists locally and provides the values
- Vite compiles everything correctly
- No deployment/scanning happens

But **on Netlify it fails** because:

- Even though you set env vars in Netlify UI, they get embedded in the bundle
- The secrets scanner then detects them in `dist/assets/index-*.js`
- Build fails to prevent accidental secret exposure

---

## How to Fix This: Two Strategies

### Strategy 1: Safe Keys (Firebase, Public OAuth IDs) ✅

**Firebase keys are inherently safe** - they're client-side config with no admin privileges. Similarly, public API keys (like Paystack public key, OAuth Client IDs) are safe to expose.

**For these, whitelist them in Netlify:**

1. Go to **Netlify Dashboard** → **Site settings** → **Build & deploy** → **Environment**
2. Add this variable:

```
Name: SECRETS_SCAN_OMIT_KEYS
Value: VITE_FIREBASE_API_KEY,VITE_FIREBASE_APP_ID,VITE_FIREBASE_AUTH_DOMAIN,VITE_FIREBASE_MEASUREMENT_ID,VITE_FIREBASE_MESSAGING_SENDER_ID,VITE_FIREBASE_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET,VITE_PAYSTACK_PUBLIC_KEY,VITE_YOUTUBE_CLIENT_ID,VITE_FACEBOOK_APP_ID,VITE_INSTAGRAM_APP_ID,VITE_TWITTER_API_KEY,VITE_TIKTOK_CLIENT_KEY
```

3. **Redeploy** - your build will succeed

✅ **This is already configured in `netlify.toml`** - check the file!

---

### Strategy 2: Sensitive Keys (Secrets) 🔒

**NEVER use `VITE_` prefix for:**

- `PAYSTACK_SECRET_KEY`
- `CLAUDE_API_KEY`
- `PERPLEXITY_API_KEY`
- `R2_SECRET_ACCESS_KEY`
- `TWITTER_API_SECRET` / `TWITTER_BEARER_TOKEN`
- `FACEBOOK_APP_SECRET`
- `INSTAGRAM_APP_SECRET`
- `TIKTOK_CLIENT_SECRET`
- `YOUTUBE_CLIENT_SECRET`
- Any OAuth refresh tokens

These should be used **server-side only** (Cloud Functions, API routes).

---

## Updated Naming Convention

Use this pattern for ALL future API keys:

| Type              | Prefix  | Usage              | Example                 |
| ----------------- | ------- | ------------------ | ----------------------- |
| **Public Client** | `VITE_` | Embedded in bundle | `VITE_FIREBASE_API_KEY` |
| **Public OAuth**  | `VITE_` | Frontend use       | `VITE_FACEBOOK_APP_ID`  |
| **Secret/Admin**  | None    | Backend only       | `PAYSTACK_SECRET_KEY`   |
| **Backend Only**  | None    | Cloud Functions    | `CLAUDE_API_KEY`        |

---

## Your Current Setup Issues

❌ **WRONG in `.env.example.new`:**

```
VITE_CLAUDE_API_KEY=        # Backend key exposed in bundle!
VITE_R2_SECRET_ACCESS_KEY=  # Secret key exposed in bundle!
VITE_TWITTER_API_SECRET=    # Secret exposed in bundle!
```

✅ **CORRECT:**

```
CLAUDE_API_KEY=             # Backend only, no VITE_
R2_SECRET_ACCESS_KEY=       # Backend only, no VITE_
TWITTER_API_SECRET=         # Backend only, no VITE_
```

---

## Action Items

### 1. ✅ Already Done (in `netlify.toml`)

- Added `SECRETS_SCAN_OMIT_KEYS` configuration
- Listed all safe Firebase and public keys

### 2. Do This Next

- **Delete** `.env.local` (you already did this ✅)
- **Update** your local `.env.local` with ONLY safe keys (VITE\_ prefix)
- **Add backend secrets in Netlify Functions environment** separately
- **Redeploy** to Netlify

### 3. For Future API Keys

- If it's a **public/client-side key**: Use `VITE_` prefix, add to `SECRETS_SCAN_OMIT_KEYS`
- If it's a **secret/backend key**: Use NO prefix, keep in Cloud Functions only

---

## Files Updated

- ✅ `netlify.toml` - Created with secrets scanning config
- ✅ `.env.example` - Updated with proper naming convention and docs

---

## Testing Locally

Make sure your `.env.local` in your workspace (locally) looks like:

```dotenv
# Frontend-safe keys only
VITE_FIREBASE_API_KEY=AIzaSyAv-WGy8mkpb-qLpEh5zFzIHhanHlhwKdA
VITE_FIREBASE_AUTH_DOMAIN=market-mind-8ff88.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=market-mind-8ff88
VITE_FIREBASE_STORAGE_BUCKET=market-mind-8ff88.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=897332196564
VITE_FIREBASE_APP_ID=1:897332196564:web:c71d2ba9b937a5ab4ab741
VITE_FIREBASE_MEASUREMENT_ID=G-G-WEFD78QQ9C

# Backend secrets stored separately in Cloud Functions
# NEVER in .env.local for web app
```

---

## Next Steps

1. **Run locally** to verify everything works
2. **Commit** the `netlify.toml` and updated `.env.example`
3. **Trigger a new deploy** on Netlify
4. If it still fails, check the **Deploy log** for which keys are still being flagged
5. Add those to `SECRETS_SCAN_OMIT_KEYS` in `netlify.toml`

Good luck! 🚀
