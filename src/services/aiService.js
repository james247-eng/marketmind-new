// aiService.js
// AI calls go to Netlify Functions (Groq API — outbound HTTP blocked on Firebase Spark).
// After a successful generation, Firebase is called ONLY to record usage in Firestore
// (pure read/write, no outbound HTTP — safe on Spark plan).

// ─── Netlify helper ───────────────────────────────────────────────────────────

const callNetlify = async (payload) => {
  const response = await fetch('/.netlify/functions/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'generate-content function failed');
  }

  return data;
};

// ─── Firebase usage recorder ──────────────────────────────────────────────────
// Calls recordContentGeneration / recordResearch in functions/index.js.
// These only write to Firestore — no outbound HTTP — so they're safe on Spark.
// Failures are non-fatal: we log but don't surface them to the user.

const recordGeneration = async (prompt, tone, businessContext, content) => {
  try {
    const record = httpsCallable(functions, 'recordContentGeneration');
    await record({ prompt, tone, businessContext, content });
  } catch (err) {
    // Don't block the UI if recording fails
    console.warn('Usage tracking failed (non-fatal):', err.message);
  }
};

const recordResearchUsage = async (topic, businessNiche, insights) => {
  try {
    const record = httpsCallable(functions, 'recordResearch');
    await record({ topic, businessNiche, insights });
  } catch (err) {
    console.warn('Research tracking failed (non-fatal):', err.message);
  }
};

// ─── generateContent ─────────────────────────────────────────────────────────
// Called by ContentGenerator.jsx
// Returns { success, content } — content is a JSON string with keys:
// twitter, linkedin, instagram, tiktok, youtube

export const generateContent = async (prompt, tone, businessContext, recentPostExamples = []) => {
  try {
    const data = await callNetlify({ type: 'generate', prompt, tone, businessContext, recentPostExamples });

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

// ─── conductResearch ─────────────────────────────────────────────────────────
// Called by ContentGenerator.jsx when "Include market research" is checked.
// Returns { success, insights } — insights is a JSON string.

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