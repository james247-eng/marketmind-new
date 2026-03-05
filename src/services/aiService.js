// aiService.js
// All AI calls go to Netlify Functions, NOT Firebase.
// Firebase Spark plan blocks outbound HTTP to Gemini API.
// The GEMINI_API_KEY is stored securely in Netlify environment variables.

// ─── Helper ───────────────────────────────────────────────────────────────────

const callNetlify = async (payload) => {
  const response = await fetch('/.netlify/functions/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request to generate-content function failed');
  }

  return data;
};

// ─── Generate social media content ───────────────────────────────────────────
// Called by ContentGenerator.jsx
// Returns { success, content } where content is a JSON string with keys:
// twitter, linkedin, instagram, tiktok, youtube

export const generateContent = async (prompt, tone, businessContext) => {
  try {
    const data = await callNetlify({ type: 'generate', prompt, tone, businessContext });

    return {
      success: true,
      content: data.content,
    };
  } catch (error) {
    console.error('Content generation error:', error);
    return {
      success: false,
      error: error.message,
      content: 'Failed to generate content. Please try again.',
    };
  }
};

// ─── Conduct market research ──────────────────────────────────────────────────
// Called by ContentGenerator.jsx when "Include market research" is checked.
// Returns { success, insights } where insights is a JSON string.

export const conductResearch = async (topic, businessNiche) => {
  try {
    const data = await callNetlify({ type: 'research', topic, businessNiche });

    return {
      success: true,
      insights: data.insights,
    };
  } catch (error) {
    console.error('Research error:', error);
    return {
      success: false,
      error: error.message,
      insights: 'Failed to conduct research. Please try again.',
    };
  }
};