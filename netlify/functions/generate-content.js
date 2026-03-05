// netlify/functions/generate-content.js
// Handles ALL AI calls (content generation + market research) via Google Gemini.
// The GEMINI_API_KEY lives only in Netlify environment variables — never in the browser.
// Firebase Spark plan blocks outbound HTTP, so this runs on Netlify instead.

const https = require('https');

// ─── Gemini API helper ────────────────────────────────────────────────────────
// Uses Node's built-in https so we don't need axios as a dependency.

const callGemini = (prompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('Missing environment variable: GEMINI_API_KEY'));

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    // gemini-2.0-flash — current free-tier model as of 2025
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          // Surface Gemini-level errors clearly
          if (parsed.error) {
            return reject(new Error(parsed.error.message || 'Gemini API error'));
          }

          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) return reject(new Error('Gemini returned no content'));

          resolve(text);
        } catch (e) {
          reject(new Error('Failed to parse Gemini response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ─── CORS headers ─────────────────────────────────────────────────────────────

const headers = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { type, prompt, tone, businessContext, topic, businessNiche } = JSON.parse(event.body);

    // ── Content generation ──────────────────────────────────────────────────
    if (type === 'generate') {
      if (!prompt || !tone || !businessContext) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: prompt, tone, businessContext' }),
        };
      }

      const geminiPrompt = `You are a professional marketing copywriter specializing in ${businessContext}.

Generate compelling social media content with the following requirements:
- Tone: ${tone}
- Task: ${prompt}

Create posts optimized for:
1. Twitter/X (280 characters max, with relevant hashtags)
2. LinkedIn (professional version, 2-3 paragraphs)
3. Instagram (engaging, with emojis and hashtags)
4. TikTok (trendy, casual tone, hook in first line)
5. YouTube (title and description with engaging hook)

IMPORTANT: Respond with ONLY a valid JSON object. No markdown, no backticks, no extra text.
Use this exact structure:
{
  "twitter": "...",
  "linkedin": "...",
  "instagram": "...",
  "tiktok": "...",
  "youtube": "..."
}`;

      const content = await callGemini(geminiPrompt);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, type: 'generate', content }),
      };
    }

    // ── Market research ─────────────────────────────────────────────────────
    if (type === 'research') {
      if (!topic || !businessNiche) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: topic, businessNiche' }),
        };
      }

      const geminiPrompt = `You are a market research analyst specializing in the ${businessNiche} industry.

Research current trends and insights about: "${topic}"

Provide a concise analysis covering:
1. Top 5 current trends
2. Key statistics or data points
3. Emerging opportunities
4. Recommended content angles
5. What competitors are doing

IMPORTANT: Respond with ONLY a valid JSON object. No markdown, no backticks, no extra text.
Use this exact structure:
{
  "trends": ["trend1", "trend2", "trend3", "trend4", "trend5"],
  "statistics": ["stat1", "stat2"],
  "opportunities": ["opp1", "opp2"],
  "contentAngles": ["angle1", "angle2", "angle3"],
  "competitorInsights": "brief summary"
}`;

      const insights = await callGemini(geminiPrompt);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, type: 'research', insights }),
      };
    }

    // Unknown type
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid type. Must be "generate" or "research".' }),
    };

  } catch (error) {
    console.error('generate-content error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};