# OAuth Callback Implementation Guide

## Overview

This guide explains how the OAuth callback system works in Market Mind and how to properly implement it.

## Architecture Flow

```
User Action (Click Connect)
        ↓
generateAuthorizationUrl() → Redirect to Platform
        ↓
User approves access on platform
        ↓
Platform redirects to: /auth/{platform}/callback?code=XXX&state=YYY
        ↓
OAuthCallback component processes callback
        ↓
exchangeAuthorizationCode() → Backend Cloud Function
        ↓
Backend exchanges code for tokens
        ↓
Tokens stored in Firestore
        ↓
Redirect to /accounts?success=...
```

## Implementation Files

### 1. **Frontend Components**

- `src/components/OAuthCallback.jsx` - Handles OAuth callbacks
- `src/features/social/SocialAccounts.jsx` - Social account management UI
- `src/utils/socialMediaUrls.js` - URL and config reference

### 2. **Services**

- `src/services/socialAuthService.js` - OAuth flow functions
  - `generateAuthorizationUrl(platform, clientId)` - Creates auth link
  - `exchangeAuthorizationCode(...)` - Exchanges code for token
  - `storeSocialConnection(...)` - Saves connection to Firestore
  - `getSocialConnection(...)` - Retrieves stored connection

### 3. **Backend (Cloud Functions)**

- `functions/oauthExchange.js` - Securely exchanges auth codes
  - Handles all platform-specific token exchanges
  - Validates tokens before storing

### 4. **Routes**

- `src/App.jsx` - Added route: `/auth/:platform/callback`

## How to Use

### Step 1: Initialize Connection

In your SocialAccounts.jsx or any component:

```jsx
import { generateAuthorizationUrl } from "../services/socialAuthService";

const handleConnectYouTube = () => {
  try {
    const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
    const authUrl = generateAuthorizationUrl("youtube", clientId);
    window.location.href = authUrl;
  } catch (error) {
    setError(error.message);
  }
};

return <button onClick={handleConnectYouTube}>Connect YouTube</button>;
```

### Step 2: Callback Handling (Automatic)

When user approves and is redirected to `/auth/youtube/callback`:

1. `OAuthCallback` component mounts
2. Extracts `code` and `state` from URL
3. Calls `exchangeAuthorizationCode()`
4. Backend exchanges code for tokens
5. Tokens stored in Firestore under `users/{uid}/socialConnections/{platform}`
6. Redirects to `/accounts?success=YouTube%20connected`

### Step 3: Retrieve Stored Connection

```jsx
import { getSocialConnection } from "../services/socialAuthService";

const connection = await getSocialConnection(userId, "youtube");
console.log(connection.accessToken); // Use for API calls
```

## Required Environment Variables

Create a `.env` file in your project root:

```env
# Google YouTube
VITE_YOUTUBE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Meta/Facebook
VITE_META_CLIENT_ID=your_meta_app_id
VITE_FACEBOOK_CLIENT_ID=your_meta_app_id

# TikTok
VITE_TIKTOK_CLIENT_ID=your_tiktok_client_id

# Instagram (use Meta)
VITE_INSTAGRAM_CLIENT_ID=your_meta_app_id

# Twitter/X
VITE_TWITTER_CLIENT_ID=your_twitter_client_id

# LinkedIn
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id

# Pinterest
VITE_PINTEREST_CLIENT_ID=your_pinterest_client_id

# Snapchat
VITE_SNAPCHAT_CLIENT_ID=your_snapchat_client_id

# Backend URLs
VITE_APP_URL=https://marketmind-02.netlify.app
VITE_BACKEND_URL=https://marketmind-02.netlify.app/.netlify/functions
```

### Backend Environment Variables (in Netlify Functions or .env.local)

```env
# These must NOT be exposed to frontend
YOUTUBE_CLIENT_SECRET=your_google_client_secret
META_CLIENT_SECRET=your_meta_app_secret
FACEBOOK_CLIENT_SECRET=your_meta_app_secret
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
INSTAGRAM_CLIENT_SECRET=your_meta_app_secret
TWITTER_CLIENT_SECRET=your_twitter_client_secret
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
PINTEREST_CLIENT_SECRET=your_pinterest_client_secret
SNAPCHAT_CLIENT_SECRET=your_snapchat_client_secret
```

## Firestore Structure

After successful connection, data is stored as:

```
users/
  {uid}/
    socialConnections/
      youtube/
        - platform: "youtube"
        - connectedAt: "2025-12-23T..."
        - accountId: "google_user_id"
        - accountName: "John Doe"
        - email: "john@example.com"
        - accessToken: "ya29.a0..."
        - refreshToken: "1//0gS..."
        - expiresAt: "2025-12-23T..."
        - scope: "https://www.googleapis.com/auth/youtube.readonly ..."
      meta/
        - ... similar structure
      tiktok/
        - ... similar structure
```

## Error Handling

The OAuthCallback component handles:

- ✅ User denies access → Shows error, redirects to `/accounts`
- ✅ No authorization code → Shows error, redirects to `/accounts`
- ✅ User not logged in → Redirects to `/login`
- ✅ Code exchange failure → Shows error, redirects to `/accounts`

Users can see error messages via URL params: `?error=User%20denied%20access`

## Security Features

1. **CSRF Protection** - State parameter validated
2. **Token Encryption** - Should be encrypted before Firestore storage
3. **Backend Exchange** - Secrets never exposed to frontend
4. **HTTPS Only** - All URLs use https://
5. **User Verification** - Auth token verified on backend

## Important Notes

⚠️ **Token Storage** - Currently accessToken stored in Firestore. For production:

- Encrypt tokens before storage
- Use `Firebase Security Rules` to restrict access
- Implement secure backend refresh flow

⚠️ **Token Refresh** - Implement automatic token refresh when they expire using `refreshAccessToken()`

⚠️ **Scope Management** - Request minimum scopes needed for your features

## Testing Locally

For local development, use ngrok to expose localhost:

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 5173

# Get URL like: https://xxxx-xx-xxx-xx.ngrok.io
# Use this in OAuth redirect URIs for testing
```

## Troubleshooting

### "State validation failed"

- Session storage expired
- User refreshed page during auth
- Solution: Clear sessionStorage and restart flow

### "No authorization code received"

- User may have clicked "Deny"
- Network error during redirect
- Wrong redirect URI registered
- Solution: Check `error` param in URL, verify redirect URI matches exactly

### Token not saved to Firestore

- Firebase security rules may be blocking write
- User not authenticated on backend
- Solution: Check Firebase console Firestore rules and backend logs

### "Redirect URI mismatch"

- Must match exactly what's registered on platform
- Cannot include query parameters
- HTTPS required (no http://)
- Solution: Check platform settings, copy exact URI from there

## Next Steps

1. ✅ Get OAuth credentials from each platform
2. ✅ Add to environment variables
3. ✅ Deploy Cloud Functions
4. ✅ Update SocialAccounts.jsx to use generateAuthorizationUrl()
5. ✅ Test with one platform first (YouTube recommended)
6. ✅ Implement token encryption for production
7. ✅ Set up automatic token refresh
