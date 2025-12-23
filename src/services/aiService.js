// aiService.js
// Handles AI API calls for content generation and research

// Claude API - Content Generation
export const generateContent = async (prompt, tone, businessContext) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY || 'placeholder',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a professional marketing copywriter. Generate engaging social media content.

Business Context: ${businessContext}
Tone: ${tone}
Task: ${prompt}

Generate a compelling post (max 280 characters for Twitter, longer for other platforms). Include relevant hashtags.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Claude API error');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content[0].text
    };
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      success: false,
      error: error.message,
      // Placeholder response for testing without API key
      content: '[AI Generated Content] This is where your marketing content will appear. Connect your Claude API key to generate real content.'
    };
  }
};

// Perplexity API - Market Research
export const conductResearch = async (topic, businessNiche) => {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY || 'placeholder'}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{
          role: 'user',
          content: `Research current trends and insights about: ${topic} in the ${businessNiche} industry. Provide 3-5 key points.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Perplexity API error');
    }

    const data = await response.json();
    return {
      success: true,
      insights: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    return {
      success: false,
      error: error.message,
      // Placeholder response
      insights: '[Market Research] Key trends and insights will appear here when you connect Perplexity API.'
    };
  }
};