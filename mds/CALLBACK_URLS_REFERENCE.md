# Social Media Callback URLs - Quick Reference

## Your App URL

**Base URL**: `https://marketmind-02.netlify.app`

## Platform-Specific Callback URLs

Copy these **exactly** into each platform's developer console:

### YouTube

```
https://marketmind-02.netlify.app/auth/youtube/callback
```

**Set in**: Google Cloud Console > Credentials > OAuth 2.0 Client ID > Authorized redirect URIs

---

### Meta / Facebook

```
https://marketmind-02.netlify.app/auth/meta/callback
```

**Set in**: Facebook Developer Console > Settings > Facebook Login > Valid OAuth Redirect URIs

---

### Facebook (Alternative)

```
https://marketmind-02.netlify.app/auth/facebook/callback
```

**Set in**: Same as Meta above (both redirect to same app)

---

### TikTok

```
https://marketmind-02.netlify.app/auth/tiktok/callback
```

**Set in**: TikTok Developer Console > Edit Application > Redirect URIs

---

### Instagram

```
https://marketmind-02.netlify.app/auth/instagram/callback
```

**Set in**: Use Meta/Facebook Developer Console (same as Meta)

---

### Twitter / X

```
https://marketmind-02.netlify.app/auth/twitter/callback
```

**Set in**: Twitter Developer Portal > Projects & Apps > Your App > Authentication > OAuth 2.0 Redirect URIs

---

### LinkedIn

```
https://marketmind-02.netlify.app/auth/linkedin/callback
```

**Set in**: LinkedIn Developer Console > Authorized Redirect URLs

---

### Pinterest

```
https://marketmind-02.netlify.app/auth/pinterest/callback
```

**Set in**: Pinterest Developer Console > OAuth Configuration > Authorized Redirect URIs

---

### Snapchat

```
https://marketmind-02.netlify.app/auth/snapchat/callback
```

**Set in**: Snapchat Business Console > OAuth Settings > Redirect URIs

---

### WhatsApp Business

```
https://marketmind-02.netlify.app/.netlify/functions/whatsapp-webhook
```

**Set in**: Meta Developer Console > WhatsApp > Configuration > Webhook Verify Token

---

## Required Static Pages (for compliance)

Make sure these pages exist:

- Privacy Policy: `https://marketmind-02.netlify.app/privacy`
- Terms of Service: `https://marketmind-02.netlify.app/terms`

✅ These are already created in your project:

- [src/pages/Privacy.jsx](src/pages/Privacy.jsx)
- [src/pages/Terms.jsx](src/pages/Terms.jsx)

---

## Callback Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Connect [Platform]"                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Redirects to platform's OAuth authorization page            │
│ e.g., https://accounts.google.com/o/oauth2/v2/auth?...    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User logs in and approves permissions                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Platform redirects back with authorization code:             │
│ https://marketmind-02.netlify.app/auth/youtube/callback     │
│    ?code=4/0AY0e-g...                                        │
│    &state=abcd1234...                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ OAuthCallback component processes:                           │
│ 1. Validates state (CSRF protection)                        │
│ 2. Extracts authorization code                              │
│ 3. Calls backend to exchange code for tokens                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Cloud Function (oauthExchange.js):                          │
│ 1. Receives authorization code                              │
│ 2. Exchanges for access token                               │
│ 3. Optionally fetches user info                             │
│ 4. Returns tokens to frontend                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend stores connection in Firestore:                    │
│ users/{uid}/socialConnections/{platform}                   │
│   - accessToken                                             │
│   - refreshToken                                            │
│   - accountId                                               │
│   - expiresAt                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Redirect to /accounts?success=YouTube%20connected           │
│ User sees confirmation & account is connected ✅            │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Template

```bash
# Frontend - VITE_ prefix (visible in browser)
VITE_YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_META_CLIENT_ID=123456789
VITE_TIKTOK_CLIENT_ID=xxx
VITE_TWITTER_CLIENT_ID=xxx
VITE_LINKEDIN_CLIENT_ID=xxx
VITE_PINTEREST_CLIENT_ID=xxx
VITE_SNAPCHAT_CLIENT_ID=xxx

# Backend - No prefix (secret, server-only)
YOUTUBE_CLIENT_SECRET=your_secret_here
META_CLIENT_SECRET=your_secret_here
TIKTOK_CLIENT_SECRET=your_secret_here
TWITTER_CLIENT_SECRET=your_secret_here
LINKEDIN_CLIENT_SECRET=your_secret_here
PINTEREST_CLIENT_SECRET=your_secret_here
SNAPCHAT_CLIENT_SECRET=your_secret_here

# General
VITE_APP_URL=https://marketmind-02.netlify.app
VITE_BACKEND_URL=https://marketmind-02.netlify.app/.netlify/functions
```

---

## Error Handling

If users see errors, check the `?error=` parameter:

- `?error=User%20denied%20access` → User clicked "No"
- `?error=no_code` → No code received from platform
- `?error=Connection%20failed` → Backend exchange failed
- `?error=State%20validation%20failed` → CSRF attack suspected

---

## Important Notes

✅ **HTTPS Only** - All URLs must use https://, not http://

✅ **Exact Match** - Redirect URIs must match exactly (case-sensitive, no trailing slash)

✅ **One App Per Platform** - Each platform gets ONE OAuth app

✅ **No Query Parameters** - Redirect URIs cannot include ?... parameters

✅ **Whitelist All URLs** - Make sure ALL callback URLs are registered

---

## Testing Locally with ngrok

```bash
# Start dev server
npm run dev

# In another terminal, start ngrok
ngrok http 5173

# Use ngrok URL in platform's redirect URI settings:
https://xxxx-xx-xxx-xx.ngrok.io/auth/youtube/callback
```

---

## Next Steps

1. Go to each platform's developer console
2. Create or select your OAuth app
3. Find the "Redirect URIs" or "OAuth Redirect URIs" setting
4. **Copy and paste the exact callback URL for that platform**
5. Save settings (may take up to a few hours to propagate)
6. Get your Client ID and Client Secret
7. Add to `.env` file with `VITE_` prefix (frontend) or just the name (backend)
8. Deploy and test!
