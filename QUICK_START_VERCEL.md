# 🚀 QUICK START: Commit & Deploy to Vercel

## One-Time Setup (Right Now)

Copy and paste these commands into PowerShell one by one:

```powershell
# Navigate to your project
cd "c:\Users\Admin\Desktop\market mind"

# Stage all changes
git add .

# Commit with a message
git commit -m "Migrate from Netlify to Vercel: add vercel.json, remove netlify.toml"

# Push to GitHub
git push origin "vercel Version"
```

**Expected Result**: See message like "vercel Version -> vercel Version" (means it worked)

---

## Vercel Setup (2-3 minutes)

### If you DON'T have Vercel yet:

1. Go to https://vercel.com
2. Click "Sign up" → "Continue with GitHub"
3. Click "Add New Project"
4. Select your `market-mind` repo
5. **Important**: Under "Git" section, select `vercel Version` as the production branch
6. Click "Deploy"

### If you ALREADY have Vercel:

1. Go to https://vercel.com/dashboard
2. Open your project
3. Settings → Git
4. Change production branch from `main` → `vercel Version`
5. Go to Deployments → click "Redeploy"

---

## Environment Variables (3 minutes)

1. In Vercel: Settings → Environment Variables
2. Click "Add New Environment Variable"
3. Enter each line from below (copy values from your `.env.local`):

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_PAYSTACK_PUBLIC_KEY=xxx
VITE_YOUTUBE_CLIENT_ID=xxx
VITE_R2_ACCOUNT_ID=xxx
VITE_R2_BUCKET_NAME=xxx
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

4. Click "Save"
5. Go back to Deployments → Redeploy latest

---

## Test (5 minutes)

1. Wait for build to complete (you'll see "Ready")
2. Click the preview link
3. Test that site loads
4. Test login
5. Test payment button

---

## That's It! 🎉

Your site should now be live on Vercel!

**URL format**: `https://market-mind.vercel.app` (or your custom domain)

---

## What You Changed

✅ Added `vercel.json` (Vercel's config file)
✅ Deleted `netlify.toml` (Netlify's config - not needed)
✅ Deleted `netlify/` folder (Netlify Functions - not needed)
✅ Updated `.env.example` files (Netlify → Vercel references)
✅ Updated `DEPLOYMENT_GUIDE.md` (Netlify → Vercel instructions)

**Nothing breaks in production** because:

- Your `main` branch is untouched
- The `vercel Version` branch is just for testing
- Once you're happy, you can merge to `main` or keep using `vercel Version`

---

## Troubleshooting

**Site shows blank page?**
→ Check environment variables in Vercel Settings

**Build failed?**
→ Check build logs: Deployments → click failed build → view logs

**Can't push to GitHub?**
→ Make sure you did `git add .` first

**Need to update OAuth URLs?**
→ Update redirect URLs in each OAuth platform (Google, Facebook, TikTok, etc.)
→ Change from `netlify.app` to `vercel.app`

---

## Next Time You Push

Every time you make changes to this branch:

```powershell
git add .
git commit -m "Your message here"
git push origin "vercel Version"
```

Vercel automatically redeploys on push - you don't need to do anything else!

---

**Read the full guide**: `VERCEL_DEPLOYMENT_GUIDE_GITHUB_BRANCHES.md` for detailed explanations
