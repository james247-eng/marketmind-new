// netlify/functions/execute-scheduled-posts.js
// Cron job that fires every 5 minutes.
// Queries Firestore for due scheduled posts and posts them to each platform.
//
// netlify.toml schedule: "*/5 * * * *"
//
// Requires environment variables:
//   FIREBASE_SERVICE_ACCOUNT  — full service account JSON as a single string
//   GROQ_API_KEY              — not used here but present in environment
//   ALLOWED_ORIGIN            — not used here (server-to-server, no CORS needed)

const admin  = require('firebase-admin');
const https  = require('https');

// ─── Firebase Admin init (safe to call multiple times in warm Lambda) ─────────

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('Failed to initialise Firebase Admin:', err.message);
  }
}

const db = () => admin.firestore();

// ─── Post to platform via the existing Netlify function ───────────────────────
// We call our own post-to-platform function internally rather than duplicating
// all the platform API logic here.

const postToPlatform = (payload) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    // Determine the correct host — works both locally and on Netlify
    const host = process.env.URL
      ? new URL(process.env.URL).hostname
      : 'marketmind-02.netlify.app';

    const req = https.request({
      hostname: host,
      path:     '/.netlify/functions/post-to-platform',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: { error: data } });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('post-to-platform request timed out'));
    });
    req.write(body);
    req.end();
  });
};

// ─── Parse content JSON — same robust parser used in ContentGenerator.jsx ─────

const parseContent = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;

  // Strategy 1: direct parse
  try { return JSON.parse(raw); } catch {}

  // Strategy 2: extract JSON block
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }

  // Strategy 3: return as facebook/twitter fallback
  return { facebook: raw, twitter: raw };
};

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Allow Netlify scheduled invocations (no httpMethod) OR
  // external POST requests with the correct secret token
  if (event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (event.httpMethod === 'POST') {
    const secret = process.env.CRON_SECRET;
    const authHeader = event.headers?.authorization || '';
    if (secret && authHeader !== `Bearer ${secret}`) {
      return { statusCode: 401, body: 'Unauthorized' };
    }
  }

  console.log('[execute-scheduled-posts] Starting run at', new Date().toISOString());

  try {
    const firestore = db();
    const now       = new Date();

    // ── 1. Query all due scheduled posts ─────────────────────────────────────
    // "Due" = status is 'scheduled' AND scheduledTime is in the past
    const snapshot = await firestore
      .collection('scheduledPosts')
      .where('status', '==', 'scheduled')
      .where('scheduledTime', '<=', now.toISOString())
      .get();

    if (snapshot.empty) {
      console.log('[execute-scheduled-posts] No due posts found.');
      return { statusCode: 200, body: JSON.stringify({ ran: true, processed: 0 }) };
    }

    console.log(`[execute-scheduled-posts] Found ${snapshot.size} due post(s).`);

    const results = [];

    // ── 2. Process each due post ──────────────────────────────────────────────
    for (const docSnap of snapshot.docs) {
      const post    = docSnap.data();
      const postId  = docSnap.id;
      const content = parseContent(post.content);

      console.log(`[execute-scheduled-posts] Processing post ${postId} for business ${post.businessId}`);

      // Mark as 'processing' immediately to prevent duplicate execution
      // if the function runs again before this one finishes
      await firestore.collection('scheduledPosts').doc(postId).update({
        status:    'processing',
        startedAt: new Date().toISOString(),
      });

      const platformResults = [];
      let   anySuccess      = false;
      let   anyFailure      = false;

      // ── 3. Post to each platform in the post's platforms array ─────────────
      for (const platformEntry of (post.platforms || [])) {
        const { platform, accountId, accessToken, accountName } = platformEntry;

        // Pick the right content for this platform
        const platformContent = content[platform]
          || content.facebook    // fallback to facebook
          || content.twitter     // fallback to twitter
          || Object.values(content)[0]  // fallback to whatever exists
          || '';

        if (!platformContent) {
          platformResults.push({ platform, accountId, success: false, error: 'No content for platform' });
          anyFailure = true;
          continue;
        }

        try {
          const response = await postToPlatform({
            platform,
            accessToken:  accessToken || platformEntry.accessToken,
            content:      platformContent,
            mediaUrl:     post.imageUrl  || null,
            pageId:       accountId,
            accountId,
            title:        content.youtubeTitle || post.prompt || 'Video',
            description:  platformContent,
          });

          const success = response.statusCode === 200 && response.body?.success;

          platformResults.push({
            platform,
            accountName: accountName || platform,
            success,
            error:       success ? null : (response.body?.error || `HTTP ${response.statusCode}`),
            postId:      response.body?.postId || null,
          });

          if (success) anySuccess = true;
          else         anyFailure = true;

          console.log(`[execute-scheduled-posts] ${platform} → ${success ? '✅ success' : '❌ failed'}`);

        } catch (err) {
          console.error(`[execute-scheduled-posts] ${platform} threw:`, err.message);
          platformResults.push({ platform, accountName, success: false, error: err.message });
          anyFailure = true;
        }
      }

      // ── 4. Update post status based on results ─────────────────────────────
      const finalStatus = anySuccess && !anyFailure ? 'published'
                        : anySuccess && anyFailure  ? 'partial'
                        : 'failed';

      await firestore.collection('scheduledPosts').doc(postId).update({
        status:         finalStatus,
        publishResults: platformResults,
        publishedAt:    new Date().toISOString(),
        updatedAt:      new Date().toISOString(),
      });

      // ── 5. Also update the source content doc status if contentId exists ───
      if (post.contentId) {
        try {
          await firestore.collection('content').doc(post.contentId).update({
            status:    finalStatus === 'published' ? 'published' : 'draft',
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('[execute-scheduled-posts] Could not update content doc:', err.message);
        }
      }

      results.push({ postId, status: finalStatus, platforms: platformResults });
      console.log(`[execute-scheduled-posts] Post ${postId} → ${finalStatus}`);
    }

    console.log('[execute-scheduled-posts] Run complete.', JSON.stringify(results));

    return {
      statusCode: 200,
      body: JSON.stringify({ ran: true, processed: results.length, results }),
    };

  } catch (error) {
    console.error('[execute-scheduled-posts] Fatal error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};