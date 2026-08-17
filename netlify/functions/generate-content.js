// netlify/functions/generate-content.js
// AI content generation via Groq API

const https = require('https');

// ─── Groq API call ────────────────────────────────────────────────────────────

const GROQ_MODELS = [
  'moonshotai/kimi-k2-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];

const requestGroq = (model, systemPrompt, userPrompt, maxTokens, conversationMessages = null) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return reject(new Error('Missing environment variable: GROQ_API_KEY'));

    const body = JSON.stringify({
      model,
      messages: conversationMessages
        ? [{ role: 'system', content: systemPrompt }, ...conversationMessages]
        : [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.85,   // slightly higher for more creative, human-feeling output
      max_tokens:  maxTokens,
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers:  {
        'Authorization':  `Bearer ${apiKey}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || 'Groq API error'));
          const text = parsed.choices?.[0]?.message?.content;
          if (!text) return reject(new Error('Groq returned no content'));
          resolve(text);
        } catch (e) {
          reject(new Error('Failed to parse Groq response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

const callGroq = async (systemPrompt, userPrompt, maxTokens = 2048, conversationMessages = null) => {
  let lastError;

  for (const model of GROQ_MODELS) {
    try {
      return await requestGroq(model, systemPrompt, userPrompt, maxTokens, conversationMessages);
    } catch (error) {
      lastError = error;
      console.warn(`Groq model ${model} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('All configured Groq models failed');
};

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://marketmind-02.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

// ─── Tone instruction library ─────────────────────────────────────────────────
// Each tone gets specific psychological and structural instructions.
// This is what makes content feel intentional rather than generic.

const TONE_INSTRUCTIONS = {
  professional: `
TONE — PROFESSIONAL:
- Write with authority and confidence. No fluff, no filler.
- Use industry-specific language that signals expertise.
- Structure content with clear value propositions.
- LinkedIn: Use the "Problem → Insight → Solution" framework.
- Facebook: Tell a business success story or share a data-backed insight.
- Twitter: Lead with a bold statement or counterintuitive fact.
- Instagram: Balance professionalism with visual storytelling language.
- TikTok: Even professional content needs a disruptive hook — start with a surprising stat or claim.
- Avoid: corporate jargon, passive voice, generic phrases like "in today's world" or "in this day and age".`,

  casual: `
TONE — CASUAL & FRIENDLY:
- Write like a trusted friend who happens to be an expert.
- Use contractions (you're, we've, it's). Short sentences. Conversational flow.
- LinkedIn: Drop the suit — be warm, relatable, and story-driven.
- Facebook: Write like you're talking to your community. Ask questions. Invite conversation.
- Twitter: Punchy, witty, like texting a friend who's also brilliant.
- Instagram: Warm, inviting, like a friend's recommendation.
- TikTok: Ultra casual. "Okay so..." or "Nobody talks about this but..." openers work well.
- Avoid: stiff language, over-explaining, sounding like a press release.`,

  witty: `
TONE — WITTY & HUMOROUS:
- Be clever, not just funny. Wit respects the audience's intelligence.
- Use unexpected comparisons, irony, self-aware humor, and pop culture references.
- LinkedIn: Humor with substance — make them laugh then make them think.
- Facebook: Relatable humor that makes people tag their friends.
- Twitter: One-liners, unexpected takes, subverted expectations. This is where wit shines most.
- Instagram: Visual humor cues — write as if accompanying a funny or ironic image.
- TikTok: Lean into trends, memes, and "POV:" style hooks.
- Avoid: forced jokes, anything that could alienate, cringe corporate humor.`,

  inspirational: `
TONE — INSPIRATIONAL:
- Move people emotionally. Connect the business message to a bigger human truth.
- Use the "Before → Struggle → Transformation" story arc.
- LinkedIn: Share a real journey — vulnerability + growth = viral on LinkedIn.
- Facebook: Longer emotional narrative. Paint a picture of what's possible.
- Twitter: Punchy wisdom. Quotable lines that people screenshot and share.
- Instagram: Visually rich language. Sentences that feel like they belong on a moodboard.
- TikTok: Raw, authentic, real-talk energy. "This is my story..." hooks.
- Avoid: toxic positivity, empty motivational clichés ("Hustle harder!", "You got this!").`,

  urgent: `
TONE — URGENT & PERSUASIVE:
- Create genuine urgency — scarcity, time, consequence, opportunity cost.
- Use social proof, specific numbers, and clear CTAs.
- LinkedIn: FOMO-driven insights. "Companies doing X are already ahead. Are you?"
- Facebook: Direct response copy. Lead with the offer, back it with proof, close with CTA.
- Twitter: "Last chance" energy but with substance. Specific numbers and deadlines.
- Instagram: Bold hook + social proof + urgent CTA. Every sentence should push forward.
- TikTok: "Stop scrolling if you want to [specific benefit]..." opener.
- Avoid: fake urgency, manipulative tactics, all-caps shouting.`,

  educational: `
TONE — EDUCATIONAL:
- Teach something genuinely useful. The best educational content makes people feel smarter.
- Use "Did you know...", numbered frameworks, and surprising facts.
- LinkedIn: The "5 things most people don't know about X" or "Here's why Y works" format.
- Facebook: Step-by-step breakdowns. Lists. Mini-tutorials people save.
- Twitter: Thread-style thinking. Even in a single tweet, hint at depth.
- Instagram: Carousel-ready content — write each point as a standalone mini-lesson.
- TikTok: "I spent [X time] learning [Y], here's what actually matters..." hook.
- Avoid: being condescending, over-simplifying, burying the insight under setup.`,
};

// ─── Platform format specs ────────────────────────────────────────────────────

const PLATFORM_SPECS = `
PLATFORM REQUIREMENTS — FOLLOW THESE PRECISELY:

TWITTER/X:
- Hard limit: 280 characters INCLUDING spaces and hashtags
- Hook must land in the first 5 words
- 2-3 hashtags maximum, woven in naturally
- End with either a question, a CTA, or a quotable closer
- Example structure: [Bold hook/claim]. [1 supporting point]. [CTA or hashtag closer]

LINKEDIN:
- Minimum 150 words, maximum 300 words
- MUST start with a single bold hook line (no "I" as first word — LinkedIn algorithm penalizes it)
- Use line breaks between every 1-2 sentences for mobile readability
- Structure: Hook → Personal/Business story or insight → Key lesson → CTA or question
- 3-5 relevant hashtags at the end only
- Do NOT use bullet points — LinkedIn rewards flowing narrative paragraphs

INSTAGRAM:
- 150-400 characters for the main caption before hashtags
- Hook in the first line (before "more" cutoff — under 125 characters)
- Use 2-3 line breaks for visual breathing room
- 10-15 hashtags in a separate block at the end (mix of niche, mid, and broad tags)
- End with a question or CTA to drive comments
- Emoji use: 3-6 emojis placed intentionally, not randomly sprinkled

TIKTOK:
- 100-200 characters
- MUST open with a scroll-stopping hook pattern:
  "POV: you discovered..." / "Nobody talks about..." / "Stop scrolling if..." / "The [industry] secret nobody tells you..."
- Casual, punchy, first-person or direct address
- 3-5 trending hashtags + 1-2 niche hashtags
- End with a call to comment, duet, or follow

FACEBOOK:
- Minimum 200 words — Facebook's algorithm rewards longer, engaging posts
- This is your LONGEST format — treat it like a short blog post or story
- Structure: Attention hook (1-2 sentences) → Story or context (2-3 paragraphs) → Key insight or offer → Clear CTA
- Write in paragraphs with natural spacing
- 2-4 hashtags only (Facebook hashtags have low impact — keep minimal)
- Ask a question at the end to drive comments
- Emojis: use 1-3 strategically, not decoratively

YOUTUBE:
- Title: 50-70 characters, SEO-optimised, curiosity-driven (use numbers, "how to", "why", secrets)
- Description: 150-300 words
- First 2 sentences must hook the viewer AND contain the main keyword
- Include: what they'll learn, why it matters, 3-5 timestamps placeholders [0:00], key takeaways
- End with subscribe CTA and 5-8 relevant tags as hashtags`;

// ─── Scroll-stopping psychology ───────────────────────────────────────────────

const PSYCHOLOGY_RULES = `
SCROLL-STOPPING CONTENT PSYCHOLOGY — APPLY THESE:

1. PATTERN INTERRUPT: Open with something unexpected. Contradict common wisdom, share a surprising stat, or start mid-story.
2. CURIOSITY GAP: Create a gap between what they know and what they want to know. "Here's what nobody told me about X..."
3. SPECIFICITY WINS: "47% of businesses fail because of this one thing" beats "many businesses fail." Always use specific numbers, timeframes, and names.
4. SOCIAL PROOF TRIGGERS: Reference real outcomes, customer wins, or industry data — even hypothetically for the business context.
5. IDENTITY LANGUAGE: Speak TO a specific person. "If you're a small business owner in [country]..." makes people feel seen.
6. OPEN LOOPS: Plant a question or tension early that only gets resolved at the end — keeps people reading.
7. CONVERSATIONAL RHYTHM: Mix short punchy sentences with longer flowing ones. Vary the pace. It feels more human.
8. STRONG CTA: Every piece of content needs ONE clear action — comment, share, click, save, follow. Not multiple.`;

// ─── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const {
      type,
      prompt,
      contentType = 'social-post',
      platform,
      brandProfile = {},
      recentPostExamples = [],
      topic,
      businessNiche,
      systemPrompt: assistantSystemPrompt,
      messages,
    } = JSON.parse(event.body);

    if (type === 'assistant') {
      const safeMessages = Array.isArray(messages)
        ? messages.filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string' && message.content.trim())
        : [];
      if (!assistantSystemPrompt || !safeMessages.length) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing required fields: systemPrompt, messages' }) };
      }
      const response = await callGroq(assistantSystemPrompt, '', 3000, safeMessages);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, type: 'assistant', response }) };
    }

    // ── Content generation ────────────────────────────────────────────────────
    if (type === 'generate') {
      if (!prompt || !brandProfile.businessName) {
        return {
          statusCode: 400,
          headers: CORS,
          body: JSON.stringify({ error: 'Missing required fields: prompt, brandProfile.businessName' }),
        };
      }

      const toneKey = String(brandProfile.tone || 'professional').toLowerCase();
      const toneInstructions = TONE_INSTRUCTIONS[toneKey] || `Write in a ${brandProfile.tone || 'professional'} tone.`;

      // Build style examples section if we have real posts from their accounts
      let styleExamplesSection = '';
      if (recentPostExamples && recentPostExamples.length > 0) {
        const exampleLines = recentPostExamples.map(ex => {
          const postsText = ex.posts.map((p, i) => `  ${i + 1}. "${p}"`).join('\n');
          return `${ex.platform.toUpperCase()} recent posts:\n${postsText}`;
        }).join('\n\n');

        styleExamplesSection = `
STYLE REFERENCE — POSTS FROM THIS BUSINESS'S ACTUAL ACCOUNTS:
Study these to understand their voice, vocabulary, and content style.
Mirror this style in your output while making the new content fresh and better.

${exampleLines}

END OF STYLE REFERENCE`;
      }

      const products = Array.isArray(brandProfile.products)
        ? brandProfile.products.map((item) => `${item.name}${item.description ? `: ${item.description}` : ''}`).join('; ')
        : '';
      const bannedTerms = Array.isArray(brandProfile.wordsToAvoid) ? brandProfile.wordsToAvoid.join(', ') : '';
      const systemPrompt = `You are a content writer for ${brandProfile.businessName}.
Brand tone: ${brandProfile.tone || 'Professional'}.
Language style: ${brandProfile.languageStyle || 'Conversational'}.
Target audience: ${brandProfile.audience || 'General audience'}.
Industry: ${brandProfile.industry || 'Not specified'}.
${products ? `Key products/services: ${products}.` : ''}
${bannedTerms ? `Never use these words: ${bannedTerms}.` : 'There are no banned terms.'}
Write content that matches this brand perfectly.

${toneInstructions}
${PSYCHOLOGY_RULES}

Return ONLY valid JSON with this exact shape: {"variants":["variant 1","variant 2","variant 3"]}.
Each variant must be complete, distinct, and ready to use. Do not include markdown fences or explanations.`;

      const typeInstructions = {
        'social-post': `Write a social media post optimized specifically for ${platform || 'Instagram'}. Follow that platform's expected length, structure, hook style, formatting, and hashtag conventions.`,
        'product-description': 'Write a persuasive product or service description with benefits, differentiators, and a clear purchase-oriented call to action.',
        'email-newsletter': 'Write a complete email newsletter with a compelling subject line, preview text, readable body, and one clear call to action.',
        'ad-copy': 'Write concise conversion-focused ad copy with a strong hook, benefit-led body, and direct call to action.',
        'blog-post-intro': 'Write an engaging blog post introduction that establishes the problem, creates curiosity, and naturally leads into the article.',
      };

      const platformGuidance = {
        instagram: 'Use a strong first-line hook, a visually expressive caption, intentional line breaks, a clear engagement CTA, and relevant hashtags.',
        facebook: 'Use a conversational story-led structure with useful context, natural paragraph spacing, and a question or CTA that invites comments.',
        twitter: 'Stay within 280 characters. Lead with the hook immediately, keep every sentence concise, and use no more than three hashtags.',
        linkedin: 'Use a professional mobile-friendly structure with a sharp opening line, short paragraphs, a useful insight, and a thoughtful CTA.',
        tiktok: 'Use a short scroll-stopping hook, casual direct language, trend-aware phrasing, and a CTA to comment, follow, or share.',
      };

      const userPrompt = `${typeInstructions[contentType] || typeInstructions['social-post']}
${contentType === 'social-post' ? platformGuidance[platform] || '' : ''}

${styleExamplesSection}

User's specific content request: ${prompt}

Create 3 meaningfully different variations. Return only the JSON object.`;

      const rawContent = await callGroq(systemPrompt, userPrompt, 3000);

      // ── Step 1: Strip markdown fences ──────────────────────────────────────
      let content = rawContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // ── Step 2: Extract just the JSON object ────────────────────────────────
      const startIdx = content.indexOf('{');
      const endIdx   = content.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        console.error('No JSON object found in response:', content.substring(0, 300));
        throw new Error('AI response does not contain a valid JSON object');
      }
      content = content.substring(startIdx, endIdx + 1);

      // ── Step 3: Fix bad control characters ─────────────────────────────────
      // LLMs sometimes emit literal newlines, tabs, and carriage returns INSIDE
      // JSON string values. These are valid in displayed text but invalid in JSON.
      // We fix them by replacing them with their escaped equivalents ONLY when
      // they appear inside a string value (between quotes).
      content = content.replace(
        /"((?:[^"\\]|\\.)*)"/gs,  // s flag: dot matches newlines inside JSON strings
        (match, inner) => {
          const fixed = inner
            .replace(/\r\n/g, '\\n')   // Windows line endings
            .replace(/\r/g,   '\\n')   // old Mac line endings
            .replace(/\n/g,   '\\n')   // Unix line endings
            .replace(/\t/g,   '\\t');  // tabs
          return '"' + fixed + '"';
        }
      );

      // ── Step 4: Parse and validate ──────────────────────────────────────────
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseErr) {
        console.error('JSON parse failed after cleaning:', parseErr.message);
        console.error('Retrying with strict prompt...');

        // ── Fallback: retry Groq with a stricter, simpler prompt ─────────────
        // If the AI still returns malformed JSON, ask it to fix its own output
        const retryPrompt = `The following JSON is malformed because it contains unescaped control characters. 
Return ONLY the corrected, valid JSON. Fix all unescaped newlines (replace literal newlines inside string values with \\n).
Do not change any content — only fix the JSON syntax.
Malformed JSON:
${rawContent.substring(0, 2000)}`;

        try {
          const retryRaw = await callGroq(
            'You are a JSON repair tool. Return ONLY valid JSON, nothing else.',
            retryPrompt,
            3000
          );
          const retryClean = retryRaw
            .replace(/\`\`\`json\s*/gi, '')
            .replace(/\`\`\`\s*/g, '')
            .trim();
          const retryStart = retryClean.indexOf('{');
          const retryEnd   = retryClean.lastIndexOf('}');
          const retryJson  = retryClean.substring(retryStart, retryEnd + 1);
          parsed = JSON.parse(retryJson);
          content = retryJson;
          console.log('Retry succeeded');
        } catch (retryErr) {
          console.error('Retry also failed:', retryErr.message);
          throw new Error('AI returned malformed JSON after retry: ' + parseErr.message);
        }
      }

      if (!Array.isArray(parsed.variants) || parsed.variants.length !== 3 || parsed.variants.some(variant => typeof variant !== 'string' || !variant.trim())) {
        throw new Error('AI response must contain exactly three non-empty variants');
      }

      content = JSON.stringify({ variants: parsed.variants.map(variant => variant.trim()) });

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: true, type: 'generate', content }),
      };
    }

    // ── Market research ───────────────────────────────────────────────────────
    if (type === 'research') {
      if (!topic || !businessNiche) {
        return {
          statusCode: 400,
          headers: CORS,
          body: JSON.stringify({ error: 'Missing required fields: topic, businessNiche' }),
        };
      }

      const systemPrompt = `You are a senior market research analyst and trend forecaster specialising in digital marketing and social media strategy. You provide sharp, actionable intelligence — not generic summaries.

Your research is:
- Data-driven and specific (real percentages, timeframes, platform names)
- Actionable (tells the marketer exactly what to do with the insight)
- Honest about what's working RIGHT NOW vs. what's declining
- Focused on the specific niche, not broad generalisations

CRITICAL OUTPUT RULE: Respond with ONLY a valid JSON object. No markdown, no backticks, no preamble.`;

      const userPrompt = `Research current trends and content opportunities for a ${businessNiche} business creating content about: "${topic}"

Provide sharp, specific, actionable intelligence. Use real data points where possible.

Return ONLY this JSON structure:
{
  "trends": ["specific trend 1 with data/context", "trend 2", "trend 3", "trend 4", "trend 5"],
  "statistics": ["specific stat 1 with source context", "specific stat 2"],
  "opportunities": ["specific content opportunity 1", "opportunity 2"],
  "contentAngles": ["angle 1 — why it works psychologically", "angle 2", "angle 3"],
  "competitorInsights": "What top performers in this niche are doing that drives engagement, and what gaps exist"
}`;

      const insights = await callGroq(systemPrompt, userPrompt, 1500);

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: true, type: 'research', insights }),
      };
    }

    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Invalid type. Must be "generate", "research", or "assistant".' }),
    };

  } catch (error) {
    console.error('generate-content error:', error.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
