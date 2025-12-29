# 🎯 CLOUDINARY MIGRATION GUIDE - Step by Step

**Status:** Complete Migration from Cloudflare R2 to Cloudinary  
**Date:** December 28, 2025  
**Estimated Time:** 45 minutes

---

## 📋 OVERVIEW

Cloudinary is a cloud-based image and video management platform. It's perfect for handling file uploads, transformations, and optimization.

**Why Cloudinary?**

- ✅ Easy to use (simpler than R2)
- ✅ Free tier generous (25 GB storage, 25 GB bandwidth)
- ✅ Built-in image optimization and transformation
- ✅ CDN included (faster delivery)
- ✅ Single API for uploads and delivery
- ✅ No need for separate SDK like AWS S3

---

## 🚀 PHASE 1: CREATE CLOUDINARY ACCOUNT (5 minutes)

### Step 1.1: Sign Up for Free

1. **Go to:** https://cloudinary.com
2. **Click:** "Sign Up For Free" (top right)
3. **Fill in:**
   - Email: your@email.com
   - Password: strong password
   - Full Name: Your Name
4. **Click:** "Sign up"
5. **Verify:** Check email and click verification link

### Step 1.2: Verify Email

- You'll get email: "Confirm your email address"
- Click the link inside
- You're now verified ✅

### Step 1.3: First Login

- Cloudinary redirects to dashboard
- You see your **Cloud Name** at top left
- **Save this** - you'll need it

---

## 🔑 PHASE 2: GET YOUR API KEYS (5 minutes)

### Step 2.1: Access Dashboard

1. Login to Cloudinary: https://cloudinary.com/console
2. You're in the **Dashboard**

### Step 2.2: Find Your Cloud Name

**It's on the Dashboard:**

```
Your cloud name is: abc123def456
```

**Copy this** → You'll add to `.env.local` as `VITE_CLOUDINARY_CLOUD_NAME`

### Step 2.3: Find Your API Key

1. **Dashboard → Settings** (left side, or click gear icon)
2. Go to **Access Keys** tab
3. You see:
   - **Cloud Name:** abc123def456 (already have this)
   - **API Key:** 1234567890abcdefghij (copy this)
   - **API Secret:** xxxxxxxxxxxxxxxxxxxxx (KEEP PRIVATE!)

**Copy these:**

- API Key → `VITE_CLOUDINARY_API_KEY`
- API Secret → `CLOUDINARY_API_SECRET` (backend only)

### Step 2.4: Generate Upload Preset (Security)

This is important for security. Don't upload with API secret from frontend!

**In Cloudinary Dashboard:**

1. **Go to:** Settings → Upload tab
2. **Scroll down to:** "Upload presets"
3. **Click:** "Add upload preset" (or "Create")
4. **Configure:**
   - Preset Name: `marketmind-uploads`
   - Unsigned: `Toggle ON` (means no API secret needed)
   - Save: `Click Save`
5. **Copy the preset name:** `marketmind-uploads`

**Add to .env.local:**

```env
VITE_CLOUDINARY_UPLOAD_PRESET=marketmind-uploads
```

---

## 📝 PHASE 3: UPDATE .env.local (5 minutes)

### Step 3.1: Replace R2 with Cloudinary

**Open:** `.env.local`

**Find and REMOVE:**

```env
# ❌ DELETE these R2 lines
VITE_R2_ACCOUNT_ID=...
R2_BUCKET_NAME=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

**REPLACE with:**

```env
# =====================================================
# 6. CLOUDINARY - Image & Video Storage
# =====================================================

# ✅ Cloudinary Cloud Name (public - safe to expose)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here

# ✅ Cloudinary API Key (public - safe to expose)
VITE_CLOUDINARY_API_KEY=your_api_key_here

# ✅ Upload Preset for unsigned uploads (public - safe)
VITE_CLOUDINARY_UPLOAD_PRESET=marketmind-uploads

# ❌ API Secret (backend only - NEVER in .env.local)
# Set CLOUDINARY_API_SECRET in Netlify environment only
# CLOUDINARY_API_SECRET=your_api_secret_here
```

### Step 3.2: Fill In Your Values

From Step 2, replace with your actual values:

- `your_cloud_name_here` → your Cloudinary cloud name (e.g., abc123def456)
- `your_api_key_here` → your API Key
- Keep `marketmind-uploads` as is (or your preset name)

**Example (DO NOT USE - for reference):**

```env
VITE_CLOUDINARY_CLOUD_NAME=dq7n8v2jk
VITE_CLOUDINARY_API_KEY=123456789012345
VITE_CLOUDINARY_UPLOAD_PRESET=marketmind-uploads
```

---

## 💻 PHASE 4: INSTALL CLOUDINARY SDK (5 minutes)

### Step 4.1: Install npm Package

**Open PowerShell and run:**

```powershell
cd c:\Users\Admin\MarketMind\marketmind-new
npm install cloudinary next-cloudinary
```

**What's installing:**

- `cloudinary` - Core SDK for server-side operations
- `next-cloudinary` - React components for uploads

**Wait for:** `added X packages`

### Step 4.2: Verify Installation

**Check package.json:**

```bash
# You should see in package.json:
"cloudinary": "^X.X.X"
"next-cloudinary": "^X.X.X"
```

---

## 🔧 PHASE 5: REFACTOR CODE (20 minutes)

### Step 5.1: Update storageService.js

Replace the entire file:

**Current file location:** `src/services/storageService.js`

**Replace with new Cloudinary version:**

```javascript
// storageService.js
// Handles file uploads to Cloudinary

import axios from "axios";

// Upload file to Cloudinary (using unsigned upload preset)
export const uploadFile = async (file, userId, businessId) => {
  try {
    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    // Add custom folder structure (Cloudinary organizes by folder)
    formData.append(
      "folder",
      `marketmind/users/${userId}/content/${businessId}`
    );

    // Add custom metadata tags
    formData.append(
      "tags",
      `user:${userId},business:${businessId},marketplace`
    );

    // Upload to Cloudinary
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      }/auto/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Return file info
    return {
      success: true,
      url: response.data.secure_url, // HTTPS URL
      publicId: response.data.public_id, // Cloudinary public ID (for later operations)
      fileName: response.data.original_filename,
      fileSize: response.data.bytes,
      format: response.data.format,
      width: response.data.width,
      height: response.data.height,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete file from Cloudinary (requires API secret - backend only)
export const deleteFile = async (publicId) => {
  // This requires backend implementation with API secret
  // Call from Cloud Function instead
  console.log("Use Cloud Function for deletions:", publicId);
};

// Get optimized image URL with transformations (client-side)
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = "auto",
    crop = "fill",
  } = options;

  const baseUrl = `https://res.cloudinary.com/${
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }/image/upload`;

  // Build transformation string
  const transformations = `w_${width},h_${height},c_${crop},q_${quality}`;

  return `${baseUrl}/${transformations}/${publicId}`;
};

// Validate file before upload
export const validateFile = (file, maxSizeMB = 10) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/quicktime",
  ];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPG, PNG, GIF, MP4, and MOV are allowed.",
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  const maxSize = file.type.startsWith("video/") ? 100 : maxSizeMB; // 100MB for videos, 10MB for images

  if (fileSizeMB > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize}MB.`,
    };
  }

  return { valid: true };
};
```

---

### Step 5.2: Update functions/index.js

**Location:** `functions/index.js`

**Find this section (around line 280-295):**

```javascript
  try {
    // Validate file
    const subscription = await getUserSubscription(userId);
    const tier = TIERS[subscription.tier];

    // In production, use Cloudflare R2 SDK...

    const r2AccountId = process.env.VITE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
    const signedUrl = `https://${r2AccountId}.r2.dev/uploads/${userId}/${fileName}`;

    return {
      success: true,
      uploadUrl: signedUrl,
      fileType
    };
```

**Replace with:**

```javascript
  try {
    // Validate file
    const subscription = await getUserSubscription(userId);
    const tier = TIERS[subscription.tier];

    // For Cloudinary, we use unsigned uploads with preset
    // No need for signed URL - client uploads directly

    return {
      success: true,
      cloudinaryCloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      uploadConfig: {
        folder: `marketmind/users/${userId}/content`,
        tags: [`user:${userId}`, 'marketplace'],
        eager: 'w_400,h_300,c_pad|w_800,h_600,c_pad' // Create thumbnails
      }
    };
```

---

## 🌐 PHASE 6: UPDATE NETLIFY ENVIRONMENT (5 minutes)

### Step 6.1: Remove R2 Variables

**Go to:** https://app.netlify.com

1. Select your site
2. **Settings → Build & Deploy → Environment**
3. **Find and DELETE:**
   - `VITE_R2_ACCOUNT_ID`
   - `R2_BUCKET_NAME`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`

### Step 6.2: Add Cloudinary Variables

**In same Environment Variables section, ADD:**

| Variable                        | Value              | Type      |
| ------------------------------- | ------------------ | --------- |
| `VITE_CLOUDINARY_CLOUD_NAME`    | Your cloud name    | Public    |
| `VITE_CLOUDINARY_API_KEY`       | Your API key       | Public    |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | marketmind-uploads | Public    |
| `CLOUDINARY_API_SECRET`         | Your API secret    | Secret ⚠️ |

**⚠️ IMPORTANT:** Mark `CLOUDINARY_API_SECRET` as "Secret"

### Step 6.3: Deploy

1. Click **Trigger Deploy**
2. Wait for "Publish" status ✅

---

## 🧪 PHASE 7: TEST LOCALLY (5 minutes)

### Step 7.1: Restart Dev Server

**PowerShell:**

```powershell
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 7.2: Test Upload

1. Open: `http://localhost:5173`
2. Go to **Dashboard → Generate Content**
3. Create content with file upload
4. Check console for upload response

**Expected:**

```javascript
{
  success: true,
  url: "https://res.cloudinary.com/xxx/image/upload/xxx.jpg",
  publicId: "marketmind/users/xxx/...",
  fileName: "content.jpg"
}
```

### Step 7.3: Verify File

1. Go to Cloudinary Dashboard
2. **Media Library**
3. You should see your file in `marketmind/users/` folder ✅

---

## 📚 REFERENCE: CLOUDINARY API FEATURES

### Simple Image Optimization

```javascript
// Make image smaller automatically
const optimizedUrl = `${baseUrl}/w_800,q_auto/${publicId}`;
```

### Image Transformations

```javascript
// Crop to thumbnail
const thumbnail = `${baseUrl}/w_200,h_200,c_thumb/${publicId}`;

// Add blur effect
const blurred = `${baseUrl}/e_blur:300/${publicId}`;

// Convert to WebP format
const webp = `${baseUrl}/f_auto/${publicId}`;
```

### Video Upload (same code)

```javascript
// Works for video too!
const video = response.data.secure_url;
const videoType = response.data.resource_type; // "video"
```

---

## ⚠️ IMPORTANT SECURITY NOTES

### DO NOT commit these to Git:

- ❌ API Secret
- ❌ Cloud Name (ok to commit actually, it's public)
- ❌ .env.local file

### Store only in Netlify:

- ✅ `CLOUDINARY_API_SECRET` (for backend operations)

### Safe to expose in frontend:

- ✅ `VITE_CLOUDINARY_CLOUD_NAME`
- ✅ `VITE_CLOUDINARY_API_KEY`
- ✅ `VITE_CLOUDINARY_UPLOAD_PRESET`

---

## 🚀 QUICK REFERENCE

### Cloudinary Dashboard

- **URL:** https://cloudinary.com/console
- **Cloud Name:** Top left on dashboard
- **API Keys:** Settings → Access Keys
- **Media Library:** All your uploaded files
- **Upload Presets:** Settings → Upload tab

### Environment Variables

```env
# Frontend (public)
VITE_CLOUDINARY_CLOUD_NAME=dq7n8v2jk
VITE_CLOUDINARY_API_KEY=123456789012345
VITE_CLOUDINARY_UPLOAD_PRESET=marketmind-uploads

# Backend only (Netlify)
CLOUDINARY_API_SECRET=xxxxxxxxxxxxx
```

### Code to Use

```javascript
// Upload (client-side)
import { uploadFile } from "@/services/storageService";
const result = await uploadFile(file, userId, businessId);

// Get optimized URL
import { getOptimizedImageUrl } from "@/services/storageService";
const thumb = getOptimizedImageUrl(publicId, { width: 200, height: 200 });
```

---

## 📊 COMPARISON: R2 vs Cloudinary

| Feature                | R2                 | Cloudinary     |
| ---------------------- | ------------------ | -------------- |
| **Setup**              | Complex            | Very simple    |
| **Transformations**    | Need separate code | Built-in URLs  |
| **Free tier**          | 10 GB/month        | 25 GB/month    |
| **Image optimization** | Manual             | Automatic      |
| **CDN**                | Yes                | Yes (included) |
| **Signed URLs**        | Yes                | Yes            |
| **API**                | AWS SDK            | Simple HTTP    |
| **Learning curve**     | Steep              | Gentle         |

---

## ✅ CHECKLIST - DONE?

- [ ] Created Cloudinary free account
- [ ] Copied Cloud Name from dashboard
- [ ] Copied API Key from Settings
- [ ] Copied API Secret (keep safe!)
- [ ] Created Upload Preset: `marketmind-uploads`
- [ ] Updated .env.local with Cloudinary vars
- [ ] Ran `npm install cloudinary next-cloudinary`
- [ ] Replaced storageService.js code
- [ ] Updated functions/index.js code
- [ ] Updated Netlify environment variables
- [ ] Triggered Netlify deploy
- [ ] Restarted dev server
- [ ] Tested upload locally
- [ ] Verified file in Cloudinary Media Library

---

## 🆘 TROUBLESHOOTING

### Upload fails with "Missing upload preset"

**Problem:** Preset name doesn't match  
**Solution:** Check spelling in .env.local matches Cloudinary

### "CORS error"

**Problem:** Cloudinary blocking request  
**Solution:** Make sure preset is set to "Unsigned"

### File not appearing in dashboard

**Problem:** Upload succeeded but no file  
**Solution:** Check Media Library, might be in different folder

### Getting 401 Unauthorized

**Problem:** API key invalid  
**Solution:** Copy exact key from Settings → Access Keys

---

**Status: ✅ Ready to migrate!**

Follow the phases in order and you'll be running Cloudinary in 45 minutes! 🚀
