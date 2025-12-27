// aiService.js
// Frontend calls Cloud Functions (secure backend)
// NEVER expose API keys in browser code

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Call Cloud Function for content generation
// API key stays secure on backend servers
export const generateContent = async (prompt, tone, businessContext) => {
  try {
    const generateContentFunction = httpsCallable(functions, 'generateContent');
    const response = await generateContentFunction({
      prompt,
      tone,
      businessContext
    });

    return {
      success: true,
      content: response.data.content
    };
  } catch (error) {
    console.error('Content generation error:', error);
    return {
      success: false,
      error: error.message,
      content: '[Content] Error generating. Try again.'
    };
  }
};

// Call Cloud Function for market research
// API key stays secure on backend servers
export const conductResearch = async (topic, businessNiche) => {
  try {
    const conductResearchFunction = httpsCallable(functions, 'conductResearch');
    const response = await conductResearchFunction({
      topic,
      businessNiche
    });

    return {
      success: true,
      insights: response.data.insights
    };
  } catch (error) {
    console.error('Research error:', error);
    return {
      success: false,
      error: error.message,
      insights: '[Research] Error conducting research. Try again.'
    };
  }
};