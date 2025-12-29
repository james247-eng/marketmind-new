# 🏃 QUICK START - COPY & PASTE COMMANDS

## Step 1: Install Dependencies (First Time Only)

```powershell
npm install
```

**Wait for this to finish (~3-5 minutes). You'll see:**

```
added 1234 packages
```

---

## Step 2: Start Development Server

```powershell
npm run dev
```

**You'll see:**

```
VITE v4.5.0  ready in 234 ms

➜  Local:   http://localhost:5173/
```

**Then open:** `http://localhost:5173` in your browser

---

## Step 3: Build for Production

```powershell
npm run build
```

**Creates:** `dist/` folder with production files

---

## Step 4: Preview Production Build

```powershell
npm run preview
```

**Lets you test the production build locally**

---

## Cloudflare R2 Setup Commands

### Get Account ID from Cloudflare Dashboard

```powershell
# This is just for reference - you need to:
# 1. Go to https://dash.cloudflare.com
# 2. R2 section
# 3. Click your bucket
# 4. Settings tab
# 5. Copy the Account ID
```

### Once you have R2 credentials, update .env.local

Open `.env.local` and find this section:

```env
# =====================================================
# 6. CLOUDFLARE R2 OBJECT STORAGE
# =====================================================

VITE_R2_ACCOUNT_ID=paste_your_account_id_here
R2_BUCKET_NAME=marketmind-content
R2_ACCESS_KEY_ID=paste_your_access_key_here
R2_SECRET_ACCESS_KEY=paste_your_secret_key_here
```

---

## Update Netlify Environment

```powershell
# These commands are just for reference
# You need to go to: https://app.netlify.com
# 1. Select your site
# 2. Settings → Build & Deploy → Environment
# 3. Add these 4 variables:

VITE_R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=marketmind-content
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key

# Then trigger deploy: Deploys → Trigger Deploy
```

---

## Other Useful Commands

### Clear node_modules (nuclear option)

```powershell
# If npm is acting weird, nuke everything and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

### Check Node/npm versions

```powershell
node --version
npm --version
```

### Run tests (if set up)

```powershell
npm run test
```

### Lint code

```powershell
npm run lint
```

---

## Firebase CLI (For deploying Cloud Functions)

```powershell
# Install Firebase CLI (one time)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Cloud Functions
firebase deploy --only functions

# Check logs
firebase functions:log
```

---

## Git Commands

```powershell
# Stage changes
git add .

# Commit
git commit -m "Your message here"

# Push to GitHub
git push origin main

# Pull latest
git pull origin main
```

---

## Project Structure Reference

```
marketmind-new/
├── src/
│   ├── components/          # React components
│   ├── features/           # Feature modules
│   ├── services/           # API services
│   ├── pages/              # Page components
│   ├── context/            # React Context
│   └── App.jsx             # Main app component
├── public/                 # Static files
├── functions/              # Firebase Cloud Functions
├── netlify/functions/      # Netlify serverless functions
├── .env.local             # ← Your environment variables go here
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies list
├── firebase.json          # Firebase config
└── netlify.toml           # Netlify config
```

---

## Environment Files Overview

| File             | Purpose              | Git Safe?              |
| ---------------- | -------------------- | ---------------------- |
| `.env.local`     | Local dev secrets    | ❌ Ignored (gitignore) |
| `netlify.toml`   | Netlify build config | ✅ Committed           |
| `vite.config.js` | Vite build config    | ✅ Committed           |
| `package.json`   | Dependencies list    | ✅ Committed           |
| `firebase.json`  | Firebase config      | ✅ Committed           |

---

## Common Issues & Fixes

### "npm: command not found"

→ Install Node.js from nodejs.org

### "vite: command not found"

→ Run `npm install` first

### "Port 5173 already in use"

→ Stop other dev servers or use: `npm run dev -- --port 3000`

### Changes not showing up

→ Check console for errors
→ Hard refresh browser: `Ctrl+Shift+R`

### Environment variables not loading

→ Restart dev server: `Ctrl+C` then `npm run dev`

---

## Remote Deployment

### Auto-deploy on GitHub Push (via Netlify)

1. Push to GitHub:

```powershell
git add .
git commit -m "Deploy"
git push origin main
```

2. Netlify auto-deploys (check: https://app.netlify.com)

### Manual Netlify Deploy

```powershell
# Install Netlify CLI (one time)
npm install -g netlify-cli

# Deploy current directory
netlify deploy

# Deploy production (requires build first)
npm run build
netlify deploy --prod
```

---

## Debug Commands

```powershell
# Clear npm cache
npm cache clean --force

# Check what's installed
npm list

# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Install specific version
npm install package-name@1.2.3
```

---

## 🚀 TL;DR - Just Run These

**First time:**

```powershell
npm install
npm run dev
```

**Every other time:**

```powershell
npm run dev
```

**When done:**

- `Ctrl+C` to stop server

**To deploy:**

```powershell
git add .
git commit -m "message"
git push origin main
# Netlify auto-deploys
```

---

That's it! You're ready to go! 🎉
