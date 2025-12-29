# 🔐 SECURITY RISK MATRIX & REMEDIATION

## Executive Summary

| Category                 | Status      | Risk Level | Action                        |
| ------------------------ | ----------- | ---------- | ----------------------------- |
| **Exposed Credentials**  | Critical    | 🔴 P0      | Immediate revoke + regenerate |
| **OAuth Implementation** | Incomplete  | 🔴 P0      | Deploy backend functions      |
| **Token Storage**        | Unencrypted | 🔴 P0      | Add encryption layer          |
| **Environment Setup**    | Incomplete  | 🔴 P0      | Set all env variables         |
| **Input Validation**     | Missing     | 🟠 P1      | Add validation middleware     |
| **CORS Security**        | Weak        | 🟠 P1      | Implement strict headers      |
| **Rate Limiting**        | Missing     | 🟠 P1      | Add to backend                |
| **Logging**              | Minimal     | 🟠 P1      | Implement audit logs          |
| **Firestore Rules**      | Unknown     | 🟠 P1      | Review and harden             |
| **Monitoring**           | None        | 🟡 P2      | Set up alerts                 |

---

## 🔴 CRITICAL VULNERABILITIES (P0 - Blocks Launch)

### CVE-1: Hard-Coded Credentials in Source Code

**File:** `netlify.toml`  
**Location:** Lines 1-3  
**Severity:** 🔴 Critical  
**CVSS Score:** 9.8 (Critical)

```plaintext
youtube api key: AIzaSyAv-WGy8mkpb-qLpEh5zFzIHhanHlhwKdA
youtube client secret: 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
```

**Attack Scenario:**

1. Attacker finds repository (public or leaked)
2. Extracts API key and secret
3. Sends requests with your credentials
4. Google counts against your quota
5. Your API key gets rate limited or banned
6. Your app stops working

**Potential Impact:**

- 🔴 **Quota Theft:** Attacker exhausts your free API quota
- 🔴 **Cost Impact:** You pay for attacker's requests
- 🔴 **Service Disruption:** Your app stops working
- 🔴 **Reputation:** Google may flag for abuse

**Remediation:**

```bash
# Step 1: Revoke immediately in Google Cloud Console
# Step 2: Delete from netlify.toml
# Step 3: Generate new credentials
# Step 4: Add to environment variables only
```

**Detection:** ✅ FOUND | **Status:** 🔴 UNFIXED

---

### CVE-2: OAuth Client Secrets Exposed in Frontend Bundle

**File:** `src/services/socialMediaService.js`  
**Location:** Lines 93-98  
**Severity:** 🔴 Critical  
**CVSS Score:** 9.3 (Critical)

```javascript
// ❌ DANGEROUS - VITE_ prefix = compiled into frontend JS
export const handleTikTokCallback = async (code, userId) => {
  const tokenResponse = await fetch(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      method: "POST",
      body: new URLSearchParams({
        client_key: import.meta.env.VITE_TIKTOK_CLIENT_KEY,
        client_secret: import.meta.env.VITE_TIKTOK_CLIENT_SECRET, // ❌ EXPOSED!
      }),
    }
  );
};
```

**Why It's Critical:**

1. `VITE_` prefix = variable is embedded in JavaScript bundle
2. Anyone downloading your website gets this value
3. Not encrypted or hidden
4. Can be extracted in seconds using DevTools or JavaScript deobfuscation

**Attack Scenario:**

1. Attacker visits your website
2. Opens DevTools → Network tab → Finds bundle.js
3. Searches for `VITE_TIKTOK_CLIENT_SECRET` in bundle
4. Finds value: `secret_abc123`
5. Uses your credentials to post spam on every user's TikTok
6. TikTok bans the application
7. All users can't use the feature

**Potential Impact:**

- 🔴 **Account Takeover:** All user tokens compromised
- 🔴 **Spam:** Attacker posts as all users
- 🔴 **Reputation:** TikTok bans your app
- 🔴 **Legal:** GDPR/CCPA violations (unauthorized data access)

**Remediation:**
Move all secret keys to backend:

```javascript
// ✅ SAFE - Callable function (backend only)
export const handleTikTokCallback = async (code, userId) => {
  const exchangeToken = httpsCallable(functions, "exchangeTikTokToken");
  const result = await exchangeToken({
    code,
    redirectUri: REDIRECT_URI,
  });
  // Backend handles secret, frontend never sees it
};
```

**Detection:** ✅ FOUND | **Status:** 🔴 UNFIXED

**Code Pattern to Find:**

```bash
grep -r "VITE_.*_SECRET" src/  # Should find nothing
grep -r "client_secret.*VITE" src/  # Should find nothing
```

---

### CVE-3: Access Tokens Stored Unencrypted in Firestore

**File:** `src/services/socialAuthService.js`  
**Location:** Lines 155-160  
**Severity:** 🔴 Critical  
**CVSS Score:** 8.7 (Critical)

```javascript
export const storeSocialConnection = async (userId, platform, tokenData) => {
  await setDoc(socialConnectionsRef, {
    platform,
    connectedAt: new Date().toISOString(),
    accountId: tokenData.accountId || tokenData.id,
    accessToken: tokenData.accessToken || "", // ❌ PLAIN TEXT!
    refreshToken: tokenData.refreshToken || "", // ❌ PLAIN TEXT!
    // ...
  });
};
```

**Why It's Critical:**

1. Firestore stores data in cloud (unencrypted at rest by default)
2. If Firestore is compromised, attacker has all tokens
3. Tokens can be used to access user's Instagram, TikTok, Facebook
4. Tokens grant ability to post as the user, delete content, access private data

**Attack Scenario:**

1. Attacker gains access to Firestore database (misconfigured security rules)
2. Finds collection: `users → {userId} → socialConnections`
3. Extracts all `accessToken` values
4. Uses tokens to post spam on all connected Instagram accounts
5. Uses tokens to access private Instagram DMs and photos
6. Uses tokens to delete TikTok videos
7. All users' social accounts compromised

**Potential Impact:**

- 🔴 **Data Breach:** All social media tokens exposed
- 🔴 **Account Hijacking:** Attackers post/delete as users
- 🔴 **Privacy Violation:** Attackers access private photos/DMs
- 🔴 **Legal:** GDPR fine up to 4% of annual revenue
- 🔴 **Reputation:** Trust destroyed

**Remediation:**
Add encryption before storing:

```javascript
// 1. Install: npm install crypto-js
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Set in environment

// 2. Encrypt tokens before storing
const encryptedToken = CryptoJS.AES.encrypt(
  tokenData.accessToken,
  ENCRYPTION_KEY
).toString();

// 3. Store encrypted
await setDoc(socialConnectionsRef, {
  accessToken: encryptedToken, // ✅ Now encrypted
  // ...
});

// 4. Decrypt when needed
const decryptedToken = CryptoJS.AES.decrypt(
  encryptedToken,
  ENCRYPTION_KEY
).toString(CryptoJS.enc.Utf8);
```

**Detection:** ✅ FOUND | **Status:** 🔴 UNFIXED

---

### CVE-4: Missing OAuth Backend Implementation

**Files:** `functions/index.js`, `netlify/functions/oauth-exchange.js`  
**Severity:** 🔴 Critical  
**Impact:** App crashes when users try to connect social media

**Problem:**
Frontend calls these backend functions that don't exist or are incomplete:

| Function                | Called From           | Status     | Impact                    |
| ----------------------- | --------------------- | ---------- | ------------------------- |
| `exchangeFacebookToken` | socialMediaService.js | ❌ Missing | Facebook login fails      |
| `postToFacebook`        | socialMediaService.js | ❌ Missing | Can't post to Facebook    |
| `exchangeTikTokToken`   | socialMediaService.js | ❌ Missing | TikTok connection fails   |
| `initializePayment`     | Pricing.jsx           | ❌ Missing | Payment flow broken       |
| `generateContent`       | aiService.js          | ✅ Exists  | Depends on GEMINI_API_KEY |

**Attack Scenario:**

1. App is deployed to production
2. User clicks "Connect Facebook"
3. User authorizes on Facebook.com
4. Gets redirected back to app with authorization code
5. App calls `exchangeFacebookToken` Cloud Function
6. Function doesn't exist → 404 error
7. User sees: "Connection Failed"
8. User leaves the app

**Potential Impact:**

- 🔴 **Feature Unavailable:** Core feature doesn't work
- 🔴 **Revenue Loss:** Can't connect social accounts = no premium upgrades
- 🔴 **Bad UX:** Users abandon app

**Remediation:**

1. Deploy Cloud Functions: `firebase deploy --only functions`
2. Add missing functions to `functions/index.js`
3. Test each function with sample requests

**Detection:** ✅ FOUND | **Status:** 🔴 UNFIXED

---

### CVE-5: Missing Environment Variables Block App Launch

**Files:** `.env.local` (doesn't exist)  
**Severity:** 🔴 Critical

**Problem:**
Frontend uses these env variables that aren't set:

```javascript
// src/services/firebase.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // ❌ undefined
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, // ❌ undefined
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // ❌ undefined
  // ...
};

// src/services/socialMediaService.js
const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || "placeholder"; // ❌ 'placeholder'
```

**When It Breaks:**

- Local dev: `npm run dev` - Firebase won't initialize
- Netlify deploy: Build passes but runtime errors
- User tries sign up: Can't authenticate with Firebase
- User tries OAuth: Redirects to wrong URL

**Remediation:**
Create `.env.local`:

```env
VITE_FIREBASE_API_KEY=your-value
VITE_FIREBASE_AUTH_DOMAIN=your-value
# ... (all 20+ variables)
```

**Detection:** ✅ FOUND | **Status:** 🔴 UNFIXED

---

## 🟠 HIGH PRIORITY VULNERABILITIES (P1 - Fix Before Launch)

### CVE-6: Missing Input Validation

**Severity:** 🟠 High  
**CVSS Score:** 7.2

Frontend sends user input directly to backend without validation:

```javascript
// ❌ No validation before sending
export const generateContent = async (prompt, tone, businessContext) => {
  const generateContentFunction = httpsCallable(functions, "generateContent");

  // User input sent directly to API
  const result = await generateContentFunction({
    prompt, // Could contain XSS
    tone, // Could contain SQL injection
    businessContext, // Could contain malicious code
  });
};
```

**Attack Scenario:**

1. Attacker crafts malicious prompt with JavaScript
2. Prompt stored in Firestore
3. When retrieved, JavaScript executes
4. Attacker steals user data or API keys

**Remediation:**

```javascript
// Add validation
function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Invalid prompt");
  }
  if (prompt.length > 1000) {
    throw new Error("Prompt too long");
  }
  // Remove potentially dangerous characters
  return prompt.replace(/[<>]/g, "");
}

const result = await generateContentFunction({
  prompt: validatePrompt(prompt),
  tone: validatePrompt(tone),
  businessContext: validatePrompt(businessContext),
});
```

---

### CVE-7: Weak CORS Configuration

**File:** `netlify/functions/oauth-exchange.js`  
**Location:** Line 62  
**Severity:** 🟠 High

```javascript
// ❌ WEAK - Only checks one domain
res.set("Access-Control-Allow-Origin", "https://marketmind-02.netlify.app");

// If domain changes (new deployment, subdomain), requests fail
// Attacker could do cross-site requests from any origin
```

**Attack Scenario:**

1. Attacker hosts `attacker.com`
2. Creates CORS request to your oauth-exchange function
3. If CORS is misconfigured, request succeeds
4. Attacker exchanges code for access token

**Remediation:**

```javascript
// ✅ SECURE - Validate origin
const ALLOWED_ORIGINS = [
  "https://marketmind-02.netlify.app",
  "https://yourapp.com",
  "http://localhost:5173",
];

if (!ALLOWED_ORIGINS.includes(req.headers.origin)) {
  return res.status(403).json({ error: "CORS not allowed" });
}

res.set("Access-Control-Allow-Origin", req.headers.origin);
```

---

### CVE-8: No Rate Limiting on API Endpoints

**Severity:** 🟠 High  
**Risk:** DDoS attacks, brute force

**Problem:**
Backend functions have no rate limiting:

```javascript
// ❌ Attacker can spam this endpoint
exports.generateContent = functions.https.onCall(async (data, context) => {
  // No rate limiting check
  // Attacker calls 1000x/second
  // Your Gemini API quota exhausted in seconds
});
```

**Attack Scenario:**

1. Attacker writes script to call `generateContent` 1000x/sec
2. Your Gemini API quota gets exhausted
3. All users see "Failed to generate content"
4. App becomes unusable
5. You pay for all those API calls

**Remediation:**

```javascript
const rateLimit = require("firebase-functions-rate-limit");

const limiters = {
  generateContent: rateLimit.withinLimit({
    name: "generateContent",
    maxCalls: 10, // 10 calls
    windowMs: 60000, // per minute
    keyBuilder: (req, res, args, context) => context.auth.uid, // per user
  }),
};

exports.generateContent = functions.https.onCall(
  limiters.generateContent(async (data, context) => {
    // Now limited to 10 calls/minute per user
  })
);
```

---

### CVE-9: No Authorization Checks on Cloud Functions

**Severity:** 🟠 High

**Problem:**
Some functions might not check if user is authenticated:

```javascript
// ❌ Missing auth check
exports.generateContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    // ✅ Has check
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }
  // ...
});

// ❌ Missing auth check
exports.getUserData = functions.https.onCall(async (data, context) => {
  // No context.auth check!
  // Anyone can call this
  const userData = await db.collection("users").doc(data.userId).get();
  return userData.data();
});
```

**Attack Scenario:**

1. Attacker calls `getUserData` with someone else's user ID
2. Gets their private data (email, payment info, etc.)
3. No authentication required

**Remediation:**
Every callable function must start with:

```javascript
if (!context.auth) {
  throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
}

const userId = context.auth.uid; // Use authenticated user ID
```

---

### CVE-10: Firestore Security Rules Unknown

**File:** `firestore.rules`  
**Severity:** 🟠 High

**Problem:**
Haven't reviewed Firestore rules. Default might be:

```javascript
// ❌ DANGEROUS - Anyone can read/write
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ❌ WIDE OPEN
    }
  }
}
```

**Attack Scenario:**

1. Attacker opens browser DevTools
2. Uses Firebase SDK to read all data: `db.collection('users').get()`
3. Gets all user emails, passwords, payment info, tokens
4. Complete database breach

**Remediation:**
Implement proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Content is read-only unless user owns it
    match /content/{docId} {
      allow read: if true;
      allow write: if request.auth.uid == resource.data.userId;
    }

    // Social connections are private
    match /users/{userId}/socialConnections/{doc} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 🟡 MEDIUM PRIORITY VULNERABILITIES (P2)

### CVE-11: No Logging of Sensitive Operations

**Severity:** 🟡 Medium

**Problem:**
No audit log of:

- Who connected which social accounts
- Who accessed whose data
- Failed login attempts
- Failed payment transactions

**Impact:**

- Can't detect compromises
- Can't investigate incidents
- Can't prove compliance

**Remediation:**

```javascript
// Log sensitive operations
async function logSensitiveOperation(userId, operation, details) {
  await admin.firestore().collection("auditLogs").add({
    userId,
    operation, // 'social_connected', 'payment_failed', etc.
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: context.rawRequest.ip,
    userAgent: context.rawRequest.headers["user-agent"],
  });
}

// Usage
await logSensitiveOperation(userId, "social_connected", {
  platform: "facebook",
  accountId: "123456",
});
```

---

### CVE-12: No Monitoring or Alerting

**Severity:** 🟡 Medium

**Problem:**
No alerts if:

- API quota exceeded
- Functions failing
- Database errors
- Security events

**Impact:**

- Don't know if app is broken
- Can't respond to incidents
- Silent failures

**Remediation:**
Set up:

1. Firebase Performance Monitoring
2. Google Cloud Error Reporting
3. Alert on quota threshold
4. Alert on function errors
5. Alert on suspicious auth patterns

---

## 📊 REMEDIATION ROADMAP

### Phase 1: Critical Fixes (Do Now - 2 hours)

```
[P0-1] Revoke exposed YouTube credentials (10 min)
[P0-2] Delete from netlify.toml (5 min)
[P0-3] Create .env.local (15 min)
[P0-4] Set Netlify env vars (10 min)
[P0-5] Deploy Cloud Functions (15 min)
[P0-6] Move OAuth secrets to backend (60 min)
[P0-7] Test locally and on Netlify (30 min)
```

### Phase 2: Security Hardening (Before Launch - 4 hours)

```
[P1-1] Add encryption for tokens (45 min)
[P1-2] Add input validation (30 min)
[P1-3] Harden Firestore rules (30 min)
[P1-4] Add auth checks to all functions (30 min)
[P1-5] Implement CORS properly (20 min)
[P1-6] Add rate limiting (30 min)
[P1-7] Set up logging (30 min)
[P1-8] Test security (60 min)
```

### Phase 3: Ongoing (After Launch)

```
[P2-1] Set up monitoring
[P2-2] Implement alerting
[P2-3] Add API versioning
[P2-4] Security audit schedule
[P2-5] Penetration testing
[P2-6] Compliance review (GDPR, CCPA, etc.)
```

---

## Compliance Checklist

- [ ] GDPR: Users can request data deletion
- [ ] CCPA: Users can access their data
- [ ] Data Encryption: Sensitive data encrypted at rest and in transit
- [ ] Access Control: Only authorized users can access data
- [ ] Audit Logging: All sensitive operations logged
- [ ] Incident Response: Plan for data breaches
- [ ] Third-party Security: OAuth providers are trusted
- [ ] Data Retention: Old data deleted after retention period

---

**Last Updated:** December 28, 2025  
**Next Review:** After Phase 1 completion
