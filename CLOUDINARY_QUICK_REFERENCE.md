# 📋 CLOUDINARY - QUICK REFERENCE CARD

## 🚀 QUICK START (45 Minutes)

```
PHASE 1: Create Account (5 min)
├─ https://cloudinary.com/users/register/free
├─ Sign up
└─ Verify email

PHASE 2: Get Keys (5 min)
├─ Cloud Name: (top left of dashboard)
├─ API Key: (Settings → Access Keys)
└─ Upload Preset: (Settings → Upload → Create)

PHASE 3: Update .env.local (5 min)
├─ VITE_CLOUDINARY_CLOUD_NAME = your cloud name
├─ VITE_CLOUDINARY_API_KEY = your API key
└─ VITE_CLOUDINARY_UPLOAD_PRESET = marketmind-uploads

PHASE 4: Install (5 min)
└─ npm install cloudinary next-cloudinary

PHASE 5: Verify (5 min)
├─ storageService.js uses Cloudinary API
├─ functions/index.js returns config
└─ .env.local has your values

PHASE 6: Test & Deploy (15 min)
├─ npm run dev
├─ Test upload
├─ Update Netlify
└─ Deploy
```

---

## 📍 CLOUDINARY DASHBOARD LOCATIONS

### Getting Cloud Name

```
Cloudinary Dashboard (home page)
→ Top left corner
→ "Your cloud name is: abc123def456"
```

### Getting API Key

```
Cloudinary Dashboard
→ Settings (gear icon, bottom left)
→ Tab: "Access Keys"
→ Copy: "API Key"
```

### Getting API Secret

```
Cloudinary Dashboard
→ Settings
→ Tab: "Access Keys"
→ Copy: "API Secret" (KEEP PRIVATE!)
```

### Creating Upload Preset

```
Cloudinary Dashboard
→ Settings
→ Tab: "Upload"
→ Section: "Upload presets"
→ Click: "Add upload preset"
→ Name: marketmind-uploads
→ Toggle: "Unsigned" ON
→ Save
```

### Viewing Uploaded Files

```
Cloudinary Dashboard
→ Left sidebar: "Media Library"
→ Your files appear here
→ Organized in: marketmind/users/ folder
```

---

## 💾 ENVIRONMENT VARIABLES

### In .env.local (Fill These)

```env
VITE_CLOUDINARY_CLOUD_NAME=dq7n8v2jk
VITE_CLOUDINARY_API_KEY=123456789012345
VITE_CLOUDINARY_UPLOAD_PRESET=marketmind-uploads
```

### In Netlify (via Dashboard)

```
VITE_CLOUDINARY_CLOUD_NAME       (Public)
VITE_CLOUDINARY_API_KEY          (Public)
VITE_CLOUDINARY_UPLOAD_PRESET    (Public)
CLOUDINARY_API_SECRET            (Secret ⚠️)
```

---

## 💻 CODE LOCATIONS

### Upload Function

```
File: src/services/storageService.js
Function: uploadFile()
Usage: uploadFile(file, userId, businessId)
Returns: { success, url, publicId, ... }
```

### Image Optimization

```
File: src/services/storageService.js
Function: getOptimizedImageUrl()
Usage: getOptimizedImageUrl(publicId, options)
Options: { width, height, quality, crop }
```

### File Validation

```
File: src/services/storageService.js
Function: validateFile()
Usage: validateFile(file, maxSizeMB)
```

### Cloud Functions

```
File: functions/index.js (around line 280)
Returns: Cloudinary config for client
Contains: cloudName, preset, uploadConfig
```

---

## 🎨 COMMON IMAGE OPERATIONS

### Get Thumbnail

```javascript
const thumb = getOptimizedImageUrl(publicId, {
  width: 200,
  height: 200,
  crop: "fill",
});
```

### Get Medium Image

```javascript
const medium = getOptimizedImageUrl(publicId, {
  width: 800,
  height: 600,
  quality: "auto",
});
```

### Upload with Metadata

```javascript
const result = await uploadFile(file, userId, businessId);
// Returns:
// - url: Public HTTPS URL
// - publicId: ID for transformations
// - fileName: Original filename
// - width/height: Image dimensions
```

---

## 🔒 SECURITY CHECKLIST

| Item          | Do            | Don't             |
| ------------- | ------------- | ----------------- |
| API Key       | In .env.local | ❌ In code        |
| API Secret    | In Netlify    | ❌ Anywhere else  |
| Cloud Name    | Public - ok   | ✅ Safe to expose |
| Upload Preset | Public - ok   | ✅ Safe to expose |
| .env.local    | In .gitignore | ❌ Don't commit   |

---

## 📱 TESTING CHECKLIST

### Local Testing

- [ ] npm install cloudinary
- [ ] .env.local filled
- [ ] npm run dev
- [ ] Upload test file
- [ ] Check browser console
- [ ] File appears in dashboard ✅

### Netlify Testing

- [ ] Update env variables
- [ ] Trigger deploy
- [ ] Wait for "Publish"
- [ ] Test upload on live site
- [ ] File in Media Library ✅

---

## 🆘 QUICK FIXES

| Problem                | Solution                           |
| ---------------------- | ---------------------------------- |
| "CORS error"           | Create unsigned upload preset      |
| "401 error"            | Check API Key spelling             |
| "File missing"         | Check Media Library, not Dashboard |
| "Upload fails"         | Check .env.local values            |
| "Node modules missing" | Run npm install                    |
| "Port in use"          | Kill other dev servers             |

---

## 📊 API ENDPOINTS

### Upload Endpoint

```
POST https://api.cloudinary.com/v1_1/{CLOUD_NAME}/auto/upload

Required fields:
- file: the file to upload
- upload_preset: your preset name
```

### Image URL

```
https://res.cloudinary.com/{CLOUD_NAME}/image/upload/{TRANSFORMATIONS}/{PUBLIC_ID}

Example with transformation:
https://res.cloudinary.com/dq7n8v2jk/image/upload/w_800,h_600,c_fill,q_auto/marketmind/users/user1/content.jpg
```

### Video URL

```
https://res.cloudinary.com/{CLOUD_NAME}/video/upload/{PUBLIC_ID}
```

---

## ⏰ TIMELINE AT A GLANCE

```
Time    Task                          Status
─────────────────────────────────────────────
0:00    Read this card                📖
0:05    Create Cloudinary account     🎯
0:10    Get Cloud Name                ✅
0:15    Get API Key                   ✅
0:20    Create Upload Preset          ✅
0:25    Update .env.local             ✅
0:30    npm install cloudinary        ⏳
0:35    Verify code changes           ✅
0:40    Test locally                  🧪
0:45    Deploy & test live            🚀
─────────────────────────────────────────────
```

---

## 📚 DOCUMENTATION LINKS

| Document                                                               | Purpose        |
| ---------------------------------------------------------------------- | -------------- |
| [CLOUDINARY_SETUP_STEPS.md](CLOUDINARY_SETUP_STEPS.md)                 | 👈 Start here! |
| [CLOUDINARY_MIGRATION_GUIDE.md](CLOUDINARY_MIGRATION_GUIDE.md)         | Full details   |
| [CLOUDINARY_REFACTORING_SUMMARY.md](CLOUDINARY_REFACTORING_SUMMARY.md) | What changed   |
| [DOCUMENTATION.md](DOCUMENTATION.md)                                   | Main reference |

---

## 🎯 3 THINGS TO REMEMBER

### 1️⃣ Unsigned Preset is Key

- Create upload preset
- Set to "Unsigned"
- Frontend can upload without secret

### 2️⃣ Three Values You Need

- Cloud Name
- API Key
- Upload Preset Name

### 3️⃣ Secrets Stay Secret

- API Secret in Netlify only
- Never in code
- Never in .env.local

---

## ✨ YOU GOT THIS!

45 minutes to working Cloudinary.

**Start:** Open [CLOUDINARY_SETUP_STEPS.md](CLOUDINARY_SETUP_STEPS.md)

**Go:** Follow Phase 1

**Win:** 🎉 Done!

---

**Questions?** This is a quick reference. For details, see the full guides!
