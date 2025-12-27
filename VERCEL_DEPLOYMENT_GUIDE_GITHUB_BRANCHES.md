# Complete Guide: GitHub Branches & Vercel Deployment

## Table of Contents

1. [Understanding Git Branches](#understanding-git-branches)
2. [Your Current Situation](#your-current-situation)
3. [Step-by-Step Workflow](#step-by-step-workflow)
4. [Vercel Deployment Process](#vercel-deployment-process)
5. [Troubleshooting](#troubleshooting)
6. [Reference Commands](#reference-commands)

---

## Understanding Git Branches

### What is a Branch?

A branch is like a "copy" of your code where you can make changes independently without affecting the main code. Think of it like:

- **main branch** = Official, production-ready code (what's currently on Netlify)
- **vercel Version branch** = Your testing ground for Netlify→Vercel migration

### Why Use Branches?

✅ **Safety**: Keep main branch stable
✅ **Testing**: Test changes before merging to main
✅ **Organization**: Work on multiple features simultaneously
✅ **Easy rollback**: If something goes wrong, revert to main

---

## Your Current Situation

You have:

- ✅ Created a new branch: `vercel Version`
- ✅ Original code is on `main` branch (safe and untouched)
- ✅ New Vercel changes will be on `vercel Version` branch

### What Happened When You Created the Branch

When you created "vercel Version" branch, Git created an EXACT COPY of the current main branch code. Now you can:

1. Make all Vercel-related changes here
2. Test everything
3. When ready, merge back to main OR deploy this branch directly to Vercel

---

## Step-by-Step Workflow

### ⚠️ CRITICAL: Before Starting

You need to have Git installed and be in the project directory. Open PowerShell/Command Prompt and navigate to your project:

```powershell
cd "c:\Users\Admin\Desktop\market mind"
```

Verify you have Git:

```powershell
git --version
```

---

### Step 1: Verify You're on the Correct Branch

**Command:**

```powershell
git branch -a
```

**Expected Output:**

```
  main
* vercel Version    ← You should see this one with * (means you're on it)
```

If the `*` is next to `main`, switch to the correct branch:

```powershell
git checkout "vercel Version"
```

---

### Step 2: Check Project Status

Before making changes, see what Git knows about:

```powershell
git status
```

**You should see:**

```
On branch vercel Version
Your branch is up to date with 'origin/vercel Version'.

nothing to commit, working tree clean
```

Or, if there are changes:

```
On branch vercel Version

Changes not staged for commit:
  modified:   vercel.json
  modified:   .env.example
  deleted:    netlify.toml
```

---

### Step 3: Stage Your Changes

All the Vercel-related changes we made need to be "staged" (prepared for commit).

**Stage ALL changes:**

```powershell
git add .
```

**Or stage specific files:**

```powershell
git add vercel.json .env.example .env.example.new
git add "mds/DEPLOYMENT_GUIDE.md"
```

**Verify what's staged:**

```powershell
git status
```

You should see green text listing changes ready to commit.

---

### Step 4: Commit Your Changes

A commit is a "snapshot" of your code at a specific point in time with a description.

```powershell
git commit -m "Migrate from Netlify to Vercel: Add vercel.json, remove netlify.toml, update env variables"
```

**Good commit messages should:**

- Be descriptive
- Explain WHAT changed and WHY
- Use present tense

**Examples of good messages:**

```
"Migrate from Netlify to Vercel: replace netlify.toml with vercel.json"
"Update environment variable references from Netlify to Vercel"
"Remove Netlify-specific files and folders"
```

**Examples of BAD messages:**

```
"Update"
"Changes"
"Fix stuff"
```

---

### Step 5: Push Your Changes to GitHub

Pushing sends your local commits to GitHub so they're backed up and can be seen by others.

```powershell
git push origin "vercel Version"
```

Or if the branch name is hard to type:

```powershell
git push
```

**Expected output:**

```
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 8 threads
Writing objects: 100% (5/5), 465 bytes | 465.00 KiB/s, done.
Total 5 (delta 2), reused 0 (delta 0), reused pack 1 (delta 0)
remote: Resolving deltas: 100% (2/2), done.
To github.com:YOUR_USERNAME/market-mind.git
   a1b2c3d..e4f5g6h  vercel Version -> vercel Version
```

---

## Vercel Deployment Process

### Option A: Deploy the "vercel Version" Branch Directly to Vercel (RECOMMENDED)

This is best because you test on Vercel BEFORE merging to main.

#### Step 1: Set Up Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Choose your GitHub repository
5. **IMPORTANT**: In Project Settings, select the branch:
   - Find the "Git" section
   - Set "Production Branch" to `vercel Version`
6. Click "Deploy"

**OR if you already have a Vercel project for Netlify:**

1. Go to your existing Vercel project settings
2. Navigate to "Git" section
3. Change "Production Branch" from `main` to `vercel Version`
4. Trigger a manual deploy: Go to "Deployments" → Click deploy button

#### Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel project → "Settings" → "Environment Variables"
2. Add all these variables (copy the values from your `.env.local`):

```
VITE_FIREBASE_API_KEY=your_value
VITE_FIREBASE_AUTH_DOMAIN=your_value
VITE_FIREBASE_PROJECT_ID=your_value
VITE_FIREBASE_STORAGE_BUCKET=your_value
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
VITE_FIREBASE_APP_ID=your_value
VITE_PAYSTACK_PUBLIC_KEY=your_value
VITE_YOUTUBE_CLIENT_ID=your_value
VITE_R2_ACCOUNT_ID=your_value
VITE_R2_BUCKET_NAME=your_value
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

3. Click "Save"

#### Step 3: Redeploy

After adding environment variables:

1. Go to "Deployments"
2. Click "Redeploy" on the latest deployment
3. Wait for the build to complete

#### Step 4: Test Your Site

Vercel provides a preview URL like: `https://vercel Version-git-YOUR-USERNAME.vercel.app`

- Test all features
- Test payment flow
- Check that OAuth callbacks work
- Verify environment variables are loaded

#### Step 5: Once Everything Works

After thoroughly testing on the `vercel Version` branch deployment:

**Option A1: Keep using this branch**

- Just keep pushing changes to `vercel Version`
- Vercel will auto-deploy on each push

**Option A2: Merge to main (when ready for production)**

```powershell
git checkout main
git pull origin main
git merge "vercel Version"
git push origin main
```

Then update Vercel to deploy from `main` instead.

---

### Option B: Deploy via Creating a Merge to Main (Traditional)

Only do this when you're 100% confident everything works.

#### Step 1: Create a Pull Request (PR) on GitHub

A Pull Request lets you review changes before merging.

1. Go to your GitHub repository
2. You should see a notification: "Recent pushes" with "vercel Version"
3. Click "Compare & pull request"
4. Add a description:

   ```
   ## Migrate from Netlify to Vercel

   - Removed netlify.toml
   - Removed netlify/ functions folder
   - Added vercel.json with proper configuration
   - Updated environment variable documentation
   - Updated deployment guide
   ```

5. Click "Create pull request"

#### Step 2: Review Changes

GitHub shows you exactly what changed:

- Green lines = Added
- Red lines = Removed
- You can comment on specific lines

#### Step 3: Merge the PR

1. Click "Merge pull request"
2. Click "Confirm merge"
3. Optionally click "Delete branch" (you can keep it if you want)

#### Step 4: Update Vercel to Deploy from main

If you're switching from `vercel Version` to `main`:

1. Go to Vercel project settings
2. Go to "Git" section
3. Change "Production Branch" from `vercel Version` to `main`
4. Trigger redeploy

---

## Troubleshooting

### Problem: "Branch 'vercel Version' not found"

**Solution:**

```powershell
git fetch origin
git checkout "vercel Version"
```

---

### Problem: Changes not showing up after push

**Check:** Are you on the right branch?

```powershell
git branch -a
```

The `*` should be next to `vercel Version`.

**Solution:** Switch branches

```powershell
git checkout "vercel Version"
```

---

### Problem: "Permission denied" when pushing

**Likely causes:**

1. You're not logged into GitHub in Git
2. You don't have push access

**Solution:**

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@gmail.com"
```

---

### Problem: Merge conflicts (scary-looking error)

**This happens when:** The same file was edited in both branches differently.

**DON'T PANIC.** Usually not serious.

**Solution:**

1. Tell us which file has conflicts
2. We can manually review and fix
3. Then commit again

To abort and start over:

```powershell
git merge --abort
```

---

### Problem: Vercel build failing

**Check these in order:**

1. **Environment Variables**: Are all VITE\_\* variables set in Vercel?

```
Go to Vercel Settings → Environment Variables
Make sure all are there and spelled correctly
```

2. **Node version**: Is it 18 or higher?

```
In Vercel, Settings → Node Version → should be 18+ or leave as "Recommended"
```

3. **Build logs**: What does Vercel say failed?

```
Go to Deployments → Click failed build → View logs
```

4. **Local test**: Does `npm run build` work on your machine?

```powershell
npm run build
```

---

## Reference Commands

### Branch Operations

```powershell
# List all branches
git branch -a

# Create a new branch (you already did this)
git branch "branch-name"

# Switch to a branch
git checkout "branch-name"

# Create AND switch to new branch
git checkout -b "branch-name"

# Delete a branch
git branch -d "branch-name"

# Rename current branch
git branch -m "new-name"
```

### Commit Operations

```powershell
# See status
git status

# Stage all changes
git add .

# Stage specific file
git add filename.txt

# Unstage changes
git reset filename.txt

# Commit staged changes
git commit -m "Your message"

# Commit with detailed message (opens editor)
git commit

# Amend last commit (if you made a typo in message)
git commit --amend -m "New message"
```

### Push/Pull Operations

```powershell
# Push to GitHub
git push origin "branch-name"

# Push with setting upstream (first time)
git push -u origin "branch-name"

# Pull latest changes
git pull origin "branch-name"

# Fetch without merging
git fetch origin
```

### View History

```powershell
# See commit history
git log --oneline

# See what changed in last commit
git show HEAD

# See all changes not yet pushed
git diff HEAD origin/"branch-name"
```

---

## Summary: Your Deployment Path

```
1. ✅ Created "vercel Version" branch locally
2. ✅ Made Vercel configuration changes (vercel.json, etc.)
3. → NEXT: git add . (stage changes)
4. → NEXT: git commit -m "message" (save snapshot)
5. → NEXT: git push origin "vercel Version" (send to GitHub)
6. → NEXT: Connect Vercel to "vercel Version" branch
7. → NEXT: Set environment variables in Vercel
8. → NEXT: Test thoroughly
9. → OPTIONAL: Merge to main when ready
```

---

## Quick Copy-Paste Workflow

If you want to just execute commands without thinking:

```powershell
# 1. Make sure you're in the right folder
cd "c:\Users\Admin\Desktop\market mind"

# 2. Switch to vercel branch
git checkout "vercel Version"

# 3. Stage all changes
git add .

# 4. Commit changes
git commit -m "Migrate from Netlify to Vercel: add vercel.json, remove netlify.toml, update environment variables"

# 5. Push to GitHub
git push origin "vercel Version"

# 6. Verify it worked
git log --oneline -5
```

Then go to Vercel dashboard and follow the deployment steps above.

---

## Need Help?

If you encounter errors:

1. Copy the FULL error message
2. Tell us what step you were on
3. We'll fix it together

DO NOT force push or use `git reset --hard` without asking - it can lose code!
