// socialMediaUrls.js
// Reference guide for all social media platform URLs and endpoints
// Use this when configuring OAuth in each platform's developer console

const APP_URL = 'https://marketmind-02.netlify.app';
const BACKEND_URL = `${APP_URL}/.netlify/functions`;

/**
 * COMPLETE URL REFERENCE FOR ALL SOCIAL MEDIA PLATFORMS
 * Copy and paste the exact URLs into each platform's developer console
 */

export const SOCIAL_MEDIA_URLS = {
  // ==================== GOOGLE / YOUTUBE ====================
  youtube: {
    name: 'YouTube',
    redirectUri: `${APP_URL}/auth/youtube/callback`,
    oauthScopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ],
    requiredUrls: {
      appUrl: APP_URL,
      privacyPolicy: `${APP_URL}/privacy`,
      termsOfService: `${APP_URL}/terms`,
    },
    documentation: 'https://developers.google.com/youtube/registering_an_application',
    notes: 'Set Application type as "Web application" in Google Cloud Console'
  },

  // ==================== META / FACEBOOK ====================
  meta: {
    name: 'Meta / Facebook',
    redirectUri: `${APP_URL}/auth/meta/callback`,
    oauthScopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'instagram_basic',
      'instagram_manage_insights',
      'instagram_manage_posts',
    ],
    requiredUrls: {
      appUrl: APP_URL,
      privacyPolicy: `${APP_URL}/privacy`,
      termsOfService: `${APP_URL}/terms`,
      appDomains: 'marketmind-02.netlify.app',
    },
    documentation: 'https://developers.facebook.com/docs/facebook-login/web',
    notes: 'Add all callback URLs in App Settings > Facebook Login > Valid OAuth Redirect URIs'
  },

  facebook: {
    name: 'Facebook',
    redirectUri: `${APP_URL}/auth/facebook/callback`,
    oauthScopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
    ],
    requiredUrls: {
      appUrl: APP_URL,
      privacyPolicy: `${APP_URL}/privacy`,
      termsOfService: `${APP_URL}/terms`,
      appDomains: 'marketmind-02.netlify.app',
    },
    documentation: 'https://developers.facebook.com/docs/facebook-login/web',
    notes: 'Use same app as Meta, but with Facebook-specific scopes'
  },

  // ==================== TIKTOK ====================
  tiktok: {
    name: 'TikTok',
    redirectUri: `${APP_URL}/auth/tiktok/callback`,
    oauthScopes: [
      'user.info.basic',
      'video.list',
      'video.publish',
      'video.upload.status.read'
    ],
    requiredUrls: {
      appUrl: APP_URL,
    },
    documentation: 'https://developers.tiktok.com/doc/login-kit-web',
    notes: 'Select "Web" as platform type in TikTok Developer Console'
  },

  // ==================== INSTAGRAM ====================
  instagram: {
    name: 'Instagram',
    redirectUri: `${APP_URL}/auth/instagram/callback`,
    oauthScopes: [
      'instagram_business_basic',
      'instagram_business_content_publish',
      'instagram_business_manage_messages',
      'instagram_manage_insights',
    ],
    requiredUrls: {
      appUrl: APP_URL,
      privacyPolicy: `${APP_URL}/privacy`,
      termsOfService: `${APP_URL}/terms`,
    },
    documentation: 'https://developers.facebook.com/docs/instagram-api/getting-started',
    notes: 'Requires Facebook Business Account. Use Meta for single OAuth integration'
  },

  // ==================== TWITTER / X ====================
  twitter: {
    name: 'Twitter / X',
    redirectUri: `${APP_URL}/auth/twitter/callback`,
    oauthScopes: [
      'tweet.read',
      'tweet.write',
      'tweet.moderate.write',
      'users.read',
      'follows.read',
      'follows.write',
      'offline.access'
    ],
    requiredUrls: {
      appUrl: APP_URL,
      privacyPolicy: `${APP_URL}/privacy`,
      termsOfService: `${APP_URL}/terms`,
    },
    documentation: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0',
    notes: 'Use OAuth 2.0 with PKCE for web apps'
  },

  // ==================== LINKEDIN ====================
  linkedin: {
    name: 'LinkedIn',
    redirectUri: `${APP_URL}/auth/linkedin/callback`,
    oauthScopes: [
      'r_basicprofile',
      'r_emailaddress',
      'w_member_social',
      'r_ads_reporting',
      'r_ads',
    ],
    requiredUrls: {
      appUrl: APP_URL,
      privacyPolicy: `${APP_URL}/privacy`,
      termsOfService: `${APP_URL}/terms`,
      authorizedRedirectUri: `${APP_URL}/auth/linkedin/callback`,
    },
    documentation: 'https://docs.microsoft.com/en-us/linkedin/shared/authentication/oauth-2?context=linkedin%2Fcampaign-manager%2Fcampaign-manager-context',
    notes: 'Requires LinkedIn Developer account and app approval'
  },

  // ==================== PINTEREST ====================
  pinterest: {
    name: 'Pinterest',
    redirectUri: `${APP_URL}/auth/pinterest/callback`,
    oauthScopes: [
      'boards:read',
      'pins:read',
      'pins:create',
      'pins:delete',
      'user_accounts:read',
    ],
    requiredUrls: {
      appUrl: APP_URL,
      redirectUri: `${APP_URL}/auth/pinterest/callback`,
    },
    documentation: 'https://developers.pinterest.com/docs/getting-started/authentication/',
    notes: 'Pinterest API v5 authentication'
  },

  // ==================== SNAPCHAT ====================
  snapchat: {
    name: 'Snapchat',
    redirectUri: `${APP_URL}/auth/snapchat/callback`,
    oauthScopes: [
      'snapchat-marketing-api',
      'snapchat-conversion-pixels',
    ],
    requiredUrls: {
      appUrl: APP_URL,
      redirectUri: `${APP_URL}/auth/snapchat/callback`,
    },
    documentation: 'https://marketingapi.snapchat.com/docs/',
    notes: 'For Snapchat Business Account integration'
  },

  // ==================== WHATSAPP BUSINESS ====================
  whatsapp: {
    name: 'WhatsApp Business',
    webhookUrl: `${BACKEND_URL}/whatsapp-webhook`,
    verifyToken: '[CREATE YOUR OWN SECURE TOKEN]',
    requiredUrls: {
      webhookUrl: `${BACKEND_URL}/whatsapp-webhook`,
      webhookVerifyToken: '[YOUR CUSTOM VERIFY TOKEN]',
    },
    documentation: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/',
    notes: 'Uses webhook for receiving messages, not OAuth'
  },
};

/**
 * ENVIRONMENT VARIABLES TO SET
 * Add these to your .env file with values from each platform's developer console
 */
export const REQUIRED_ENV_VARIABLES = {
  // Google / YouTube
  VITE_YOUTUBE_CLIENT_ID: 'From Google Cloud Console - OAuth 2.0 Client ID',
  YOUTUBE_CLIENT_SECRET: 'From Google Cloud Console - keep secret on backend',

  // Meta / Facebook
  VITE_META_CLIENT_ID: 'From Facebook Developer Console - App ID',
  META_CLIENT_SECRET: 'From Facebook Developer Console - App Secret',
  VITE_FACEBOOK_CLIENT_ID: 'Same as META_CLIENT_ID',
  FACEBOOK_CLIENT_SECRET: 'Same as META_CLIENT_SECRET',

  // TikTok
  VITE_TIKTOK_CLIENT_ID: 'From TikTok Developer Console',
  TIKTOK_CLIENT_SECRET: 'From TikTok Developer Console',

  // Instagram
  VITE_INSTAGRAM_CLIENT_ID: 'From Facebook Developer Console (use Meta app)',
  INSTAGRAM_CLIENT_SECRET: 'From Facebook Developer Console',

  // Twitter / X
  VITE_TWITTER_CLIENT_ID: 'From Twitter Developer Portal - Client ID',
  TWITTER_CLIENT_SECRET: 'From Twitter Developer Portal',

  // LinkedIn
  VITE_LINKEDIN_CLIENT_ID: 'From LinkedIn Developer Console',
  LINKEDIN_CLIENT_SECRET: 'From LinkedIn Developer Console',

  // Pinterest
  VITE_PINTEREST_CLIENT_ID: 'From Pinterest Developer Console',
  PINTEREST_CLIENT_SECRET: 'From Pinterest Developer Console',

  // Snapchat
  VITE_SNAPCHAT_CLIENT_ID: 'From Snapchat Business Console',
  SNAPCHAT_CLIENT_SECRET: 'From Snapchat Business Console',

  // General
  VITE_APP_URL: 'https://marketmind-02.netlify.app',
  VITE_BACKEND_URL: 'https://marketmind-02.netlify.app/.netlify/functions',
};

/**
 * STEP-BY-STEP SETUP CHECKLIST FOR EACH PLATFORM
 */
export const SETUP_CHECKLIST = {
  youtube: [
    '1. Go to Google Cloud Console (console.cloud.google.com)',
    '2. Create a new project named "Market Mind YouTube"',
    '3. Enable YouTube Data API v3',
    '4. Create OAuth 2.0 credentials (Web application)',
    '5. Add authorized redirect URI: ' + SOCIAL_MEDIA_URLS.youtube.redirectUri,
    '6. Copy Client ID and Client Secret to .env',
    '7. Add OAuth 2.0 consent screen details',
  ],
  meta: [
    '1. Go to Facebook Developer Console (developers.facebook.com)',
    '2. Create a new app or use existing',
    '3. Go to Settings > Basic, copy App ID and App Secret',
    '4. Go to Products > Facebook Login > Settings',
    '5. Add Valid OAuth Redirect URIs:',
    '   - ' + SOCIAL_MEDIA_URLS.meta.redirectUri,
    '6. Add App Domains: marketmind-02.netlify.app',
    '7. Add Privacy Policy URL and Terms URL',
  ],
  tiktok: [
    '1. Go to TikTok Developer Console (developers.tiktok.com)',
    '2. Create a new application',
    '3. Select platform: Web',
    '4. Add Redirect URI: ' + SOCIAL_MEDIA_URLS.tiktok.redirectUri,
    '5. Copy Client ID and Client Secret',
    '6. Enable required scopes in Basic Info',
  ],
  twitter: [
    '1. Go to Twitter Developer Portal (developer.twitter.com)',
    '2. Create a new Project',
    '3. Create an App within the project',
    '4. Go to Authentication Settings',
    '5. Enable OAuth 2.0',
    '6. Add Redirect URI: ' + SOCIAL_MEDIA_URLS.twitter.redirectUri,
    '7. Set Website URL: ' + SOCIAL_MEDIA_URLS.twitter.requiredUrls.appUrl,
  ],
  linkedin: [
    '1. Go to LinkedIn Developer Console (linkedin.com/developers)',
    '2. Create a new app',
    '3. Go to Auth > Authorized redirect URLs',
    '4. Add: ' + SOCIAL_MEDIA_URLS.linkedin.redirectUri,
    '5. Copy Client ID and Client Secret',
    '6. Add Privacy Policy and Terms URLs in Legal URL section',
  ],
};

/**
 * Platform-specific notes and gotchas
 */
export const PLATFORM_NOTES = {
  youtube: {
    warning: 'YouTube API requires app review before production use',
    tip: 'Start with OAuth 2.0 credentials, not API keys',
    scopes: 'Use minimal scopes needed - ask for youtube.readonly if not publishing'
  },
  meta: {
    warning: 'Meta requires business account for certain features',
    tip: 'Use same app for Facebook, Instagram, and WhatsApp',
    scopes: 'Different apps may require different permissions - test thoroughly'
  },
  twitter: {
    warning: 'Twitter recently changed to OAuth 2.0 - v1.1 deprecated',
    tip: 'Use PKCE flow for web applications',
    scopes: 'Request only necessary scopes - review is stricter now'
  },
  linkedin: {
    warning: 'LinkedIn API requires manual app review',
    tip: 'Use separate app ID for testing vs production',
    scopes: 'Some scopes require additional approval'
  },
};

export default {
  SOCIAL_MEDIA_URLS,
  REQUIRED_ENV_VARIABLES,
  SETUP_CHECKLIST,
  PLATFORM_NOTES,
};
