# Firestore Read/Write Operations Inventory

## FILES THAT INTERACT WITH FIRESTORE

### **1. Services (Backend Logic)**

| File | Read/Write | Collections | Operations | Status |
|------|-----------|-------------|-----------|--------|
| `authService.js` | WRITE | `users` | `setDoc()` on sign up, sign in | Creates user document |
| `socialMediaService.js` | READ/WRITE | `socialAccounts` | `addDoc()`, `query()`, `getDocs()`, `deleteDoc()` | ⚠️ **USES TOP-LEVEL** |
| `socialAuthService.js` | READ/WRITE | `users/{userId}/socialConnections` | `setDoc()`, `getDoc()`, `updateDoc()`, `deleteDoc()` | ⚠️ **USES SUBCOLLECTION** |
| `contentService.js` | READ/WRITE | `content` | `addDoc()`, `query()`, `getDocs()`, `updateDoc()` | Saves generated content |
| `schedulingService.js` | READ/WRITE | `scheduledPosts` | `addDoc()`, `query()`, `getDocs()`, `updateDoc()` | Schedules posts |
| `dataDeletionService.js` | READ/WRITE | `businesses`, `content`, `scheduledPosts`, `socialAccounts` | `query()`, `getDocs()`, `deleteDoc()` | Deletes user data |

### **2. Features/Components (UI Components)**

| File | Read/Write | Collections | Operations |
|------|-----------|-------------|-----------|
| `BusinessList.jsx` | READ | `businesses` | `query()`, `getDocs()` |
| `CreateBusiness.jsx` | WRITE | `businesses` | `addDoc()` |
| `Dashboard.jsx` | READ | `businesses` | `query()`, `getDocs()` |
| `SocialAccounts.jsx` | READ/WRITE | `socialAccounts` | Calls `getConnectedAccounts()` |
| `PostScheduler.jsx` | READ/WRITE | `scheduledPosts`, `content` | Calls service functions |
| `ContentGenerator.jsx` | WRITE | `content` | Calls service functions |
| `ContentHistory.jsx` | READ | `content` | Calls service functions |

---

## COLLECTIONS BEING USED IN CODE

```
✓ users
  └─ socialConnections/ (subcollection - used in socialAuthService.js)
  
✓ businesses
✓ content
✓ scheduledPosts
✓ socialAccounts (top-level - used in socialMediaService.js)
✓ subscriptions
✓ usage
✓ payments
✓ training_data
```

---

## **THE CONFLICT: TWO SYSTEMS FOR SOCIAL ACCOUNTS**

### **System 1: socialAuthService.js (Uses Subcollections)**
```javascript
// Path: /users/{userId}/socialConnections/{platform}
const socialConnectionsRef = doc(db, 'users', userId, 'socialConnections', platform);
await setDoc(socialConnectionsRef, {...})
```

### **System 2: socialMediaService.js (Uses Top-Level)**
```javascript
// Path: /socialAccounts/{accountId}
await addDoc(collection(db, 'socialAccounts'), {
  userId: userId,
  platform: 'facebook',
  ...
})
```

---

## CURRENT FIRESTORE RULES ISSUE

**Current Rules in `firestore.rules`:**
```firestore
match /socialAccounts/{accountId} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId;
}
```

**Problem:** No check for `request.auth != null` on READ operations
- If user is not authenticated → `request.auth.uid` is undefined
- Undefined !== userId → Permission denied
- But code might be trying to read without proper auth check

---

## WHY YOU'RE STILL GETTING PERMISSION ERROR

### **The Flow When Error Occurs:**

1. User connects Facebook via `socialMediaService.js`
2. Token saved to `/socialAccounts/{id}` with `userId` field ✓ Works (create rule passes)
3. User navigates to `/accounts` page
4. Page calls `getConnectedAccounts(userId)` 
5. Query tries to read `collection(db, 'socialAccounts')` WHERE `userId == userId`
6. **Firestore checks rule:** `request.auth.uid == resource.data.userId`
7. **May fail if:**
   - Auth token expired
   - Auth not initialized yet
   - userId field not saved correctly
   - Firestore rules not redeployed

---

## ACTION ITEMS

### **1. First: Verify Rules Are Deployed**
```bash
firebase deploy --only firestore:rules
```

### **2. Second: Add Auth Check**
Update `/firestore.rules`:
```firestore
match /socialAccounts/{accountId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}
```

### **3. Third: Consolidate (Later)**
Choose ONE approach:
- Option A: Use only top-level `/socialAccounts` (current socialMediaService.js)
- Option B: Use only subcollections `/users/{userId}/socialConnections` (remove socialMediaService.js)
