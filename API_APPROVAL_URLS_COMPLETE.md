# Complete API Approval URLs - All Platforms

## Your Base Information

**App Name**: MarketMind  
**Homepage/Website URL**: `https://marketmind-02.netlify.app`  
**Privacy Policy**: `https://marketmind-02.netlify.app/privacy`  
**Terms of Service**: `https://marketmind-02.netlify.app/terms`

---

## TIKTOK

### Required URLs for TikTok App Review:

| URL Type                     | URL                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| **Website**                  | `https://marketmind-02.netlify.app`                                                     |
| **Privacy Policy**           | `https://marketmind-02.netlify.app/privacy`                                             |
| **Terms of Service**         | `https://marketmind-02.netlify.app/terms`                                               |
| **OAuth Redirect URI**       | `https://marketmind-02.netlify.app/auth/tiktok/callback`                                |
| **Webhook URL**              | `https://marketmind-02.netlify.app/.netlify/functions/tiktok-webhook`                   |
| **Verification File**        | `https://marketmind-02.netlify.app/tiktok-developers-site-verification.txt`             |
| **Alternative Verification** | `https://marketmind-02.netlify.app/.well-known/tiktok-developers-site-verification.txt` |

### Where to Add in TikTok Developer Console:

1. Go to: `developers.tiktok.com/app/[YOUR_APP_ID]/settings/basic`
2. **Website**: Paste under "Website"
3. **Redirect URI**: Under "Redirect URIs" section
4. **Verification**: Use the verification file URL when prompted
5. **Privacy/Terms**: Link them in app description

---

## YOUTUBE / GOOGLE

### Required URLs:

| URL Type               | URL                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| **Website**            | `https://marketmind-02.netlify.app`                                    |
| **Privacy Policy**     | `https://marketmind-02.netlify.app/privacy`                            |
| **Terms of Service**   | `https://marketmind-02.netlify.app/terms`                              |
| **OAuth Redirect URI** | `https://marketmind-02.netlify.app/auth/youtube/callback`              |
| **Webhook URL**        | `https://marketmind-02.netlify.app/.netlify/functions/youtube-webhook` |

### Where to Add in Google Cloud Console:

1. Go to: `console.cloud.google.com` > Credentials > OAuth 2.0 Client IDs
2. **Authorized Redirect URIs**: Add the callback URL
3. **Consent Screen**: Add privacy policy and terms URLs

---

## META / FACEBOOK / INSTAGRAM

### Required URLs:

| URL Type               | URL                                                                     |
| ---------------------- | ----------------------------------------------------------------------- |
| **Website**            | `https://marketmind-02.netlify.app`                                     |
| **Privacy Policy**     | `https://marketmind-02.netlify.app/privacy`                             |
| **Terms of Service**   | `https://marketmind-02.netlify.app/terms`                               |
| **OAuth Redirect URI** | `https://marketmind-02.netlify.app/auth/meta/callback`                  |
| **Webhook URL**        | `https://marketmind-02.netlify.app/.netlify/functions/whatsapp-webhook` |

### Where to Add in Meta Developer Console:

1. Go to: `developers.facebook.com` > My Apps > [Your App] > Settings > Basic
2. **Valid OAuth Redirect URIs**: Add callback URL
3. **Privacy Policy URL & Terms URL**: Add in Settings
4. **Webhook**: If using WhatsApp, add webhook URL under WhatsApp Configuration

---

## TWITTER / X

### Required URLs:

| URL Type               | URL                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| **Website**            | `https://marketmind-02.netlify.app`                                    |
| **Privacy Policy**     | `https://marketmind-02.netlify.app/privacy`                            |
| **Terms of Service**   | `https://marketmind-02.netlify.app/terms`                              |
| **OAuth Redirect URI** | `https://marketmind-02.netlify.app/auth/twitter/callback`              |
| **Webhook URL**        | `https://marketmind-02.netlify.app/.netlify/functions/twitter-webhook` |

### Where to Add in Twitter Developer Portal:

1. Go to: `developer.twitter.com/en/portal/dashboard`
2. **Settings > Authentication Settings**
3. **OAuth 2.0 Redirect URIs**: Add the callback URL
4. **Website URL**: Add in app details
5. **Privacy Policy & Terms**: Add links in app description

---

## LINKEDIN

### Required URLs:

| URL Type               | URL                                                        |
| ---------------------- | ---------------------------------------------------------- | --- | --------------- | ----------------------------------------------------------------------- |
| **Website**            | `https://marketmind-02.netlify.app`                        |
| **Privacy Policy**     | `https://marketmind-02.netlify.app/privacy`                |
| **Terms of Service**   | `https://marketmind-02.netlify.app/terms`                  |
| **OAuth Redirect URI** | `https://marketmind-02.netlify.app/auth/linkedin/callback` |     | **Webhook URL** | `https://marketmind-02.netlify.app/.netlify/functions/linkedin-webhook` |

### Where to Add in LinkedIn Developer Console:

1. Go to: `linkedin.com/developers/apps` > Your App > Auth
2. **Authorized Redirect URLs**: Add callback URL
3. **App details**: Add website, privacy, and terms URLs

---

## PINTEREST

### Required URLs:

| URL Type               | URL                                                                      |
| ---------------------- | ------------------------------------------------------------------------ |
| **Website**            | `https://marketmind-02.netlify.app`                                      |
| **Privacy Policy**     | `https://marketmind-02.netlify.app/privacy`                              |
| **Terms of Service**   | `https://marketmind-02.netlify.app/terms`                                |
| **OAuth Redirect URI** | `https://marketmind-02.netlify.app/auth/pinterest/callback`              |
| **Webhook URL**        | `https://marketmind-02.netlify.app/.netlify/functions/pinterest-webhook` |

### Where to Add in Pinterest Developer Console:

1. Go to: Pinterest Developer Console > Your App > OAuth
2. **Redirect URIs**: Add callback URL
3. **App Details**: Add all URLs

---

## SNAPCHAT

### Required URLs:

| URL Type               | URL                                                                     |
| ---------------------- | ----------------------------------------------------------------------- |
| **Website**            | `https://marketmind-02.netlify.app`                                     |
| **Privacy Policy**     | `https://marketmind-02.netlify.app/privacy`                             |
| **Terms of Service**   | `https://marketmind-02.netlify.app/terms`                               |
| **OAuth Redirect URI** | `https://marketmind-02.netlify.app/auth/snapchat/callback`              |
| **Webhook URL**        | `https://marketmind-02.netlify.app/.netlify/functions/snapchat-webhook` |

### Where to Add in Snapchat Business Console:

1. Go to: Snapchat Ads Manager > Business Console > Apps
2. **Redirect URIs**: Add callback URL
3. Add privacy/terms in app description

---

## INSTAGRAM (via Meta)

### Required URLs:

| URL Type               | URL                                                                      |
| ---------------------- | ------------------------------------------------------------------------ |
| **Website**            | `https://marketmind-02.netlify.app`                                      |
| **Privacy Policy**     | `https://marketmind-02.netlify.app/privacy`                              |
| **Terms of Service**   | `https://marketmind-02.netlify.app/terms`                                |
| **OAuth Redirect URI** | `https://marketmind-02.netlify.app/auth/instagram/callback`              |
| **Webhook URL**        | `https://marketmind-02.netlify.app/.netlify/functions/instagram-webhook` |

**Note**: Instagram uses Meta/Facebook's developer console. Use the same setup as Meta above.

---

## COPY-PASTE QUICK REFERENCE

### All Callback/Redirect URIs (Copy all of these)

```
https://marketmind-02.netlify.app/auth/youtube/callback
https://marketmind-02.netlify.app/auth/meta/callback
https://marketmind-02.netlify.app/auth/facebook/callback
https://marketmind-02.netlify.app/auth/instagram/callback
https://marketmind-02.netlify.app/auth/twitter/callback
https://marketmind-02.netlify.app/auth/linkedin/callback
https://marketmind-02.netlify.app/auth/pinterest/callback
https://marketmind-02.netlify.app/auth/snapchat/callback
https://marketmind-02.netlify.app/auth/tiktok/callback
```

### All Required Policy URLs (Copy all of these)

```
https://marketmind-02.netlify.app/privacy
https://marketmind-02.netlify.app/terms
https://marketmind-02.netlify.app
```

### Webhook URLs (All platforms)

```
⚠️  DO NOT ADD WEBHOOKS FOR INITIAL API APPROVAL
Webhooks are only configured AFTER approval if you need real-time events.
Platforms only require Redirect URIs, Privacy Policy, and Terms for approval.
```

### TikTok Verification File (Copy exactly as is)

```
https://marketmind-02.netlify.app/tiktok-developers-site-verification.txt
```

---

## IMPORTANT CHECKLIST

Before submitting for API approval on ANY platform:

- [ ] All URLs are using **HTTPS** (not HTTP)
- [ ] Privacy Policy page exists and is accessible
- [ ] Terms of Service page exists and is accessible
- [ ] Callback URLs match **EXACTLY** (case-sensitive, no trailing slashes)
- [ ] TikTok verification file is accessible and contains the correct token
- [ ] App description explains how it uses each platform's API
- [ ] You have screenshots of the app UI ready
- [ ] You have a demo video (for TikTok)
- [ ] Contact email is provided for support

---

## Common Mistakes to AVOID ❌

- ❌ Using `http://` instead of `https://`
- ❌ Adding query parameters to redirect URIs: `/callback?platform=youtube`
- ❌ Using localhost URLs: `localhost:3000/callback`
- ❌ Trailing slashes: `/callback/` instead of `/callback`
- ❌ Typos in URLs (copy-paste to avoid errors)
- ❌ Not registering ALL callback URLs (register them all even if not using now)
- ❌ Forgetting to verify domain ownership (TikTok)

---

## Testing Your URLs

To verify all URLs are working before submitting:

```bash
# Test homepage
curl -I https://marketmind-02.netlify.app

# Test privacy page
curl -I https://marketmind-02.netlify.app/privacy

# Test terms page
curl -I https://marketmind-02.netlify.app/terms

# Test TikTok verification file
curl https://marketmind-02.netlify.app/tiktok-developers-site-verification.txt
```

All should return **HTTP 200** (or redirect with 301/302).

---

## Next Steps

1. **Copy all URLs above** into each platform's developer console
2. **Submit for review** on each platform
3. **Wait for approval** (typically 1-7 days depending on platform)
4. **Check approval status** in each platform's developer dashboard
5. Once approved, start using the APIs in your app!
