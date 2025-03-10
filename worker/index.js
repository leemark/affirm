/**
 * Affirm - Cloudflare Worker for generating positive affirmations
 * 
 * This worker uses the Gemini API to generate positive affirmations
 * and provide context-aware follow-up affirmations.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Create a new Hono app instance
const app = new Hono();

// Apply CORS middleware
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

/**
 * Generate a positive affirmation
 */
async function generateAffirmation(apiKey) {
  try {
    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the generative model (Gemini)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 1.15,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
    });

    // Construct prompt
    const prompt = `Generate a single, brief positive affirmation that is uplifting and encouraging.
                    The affirmation should be a single sentence, no more than 15 words.
                    It should be written in second person (using "you").
                    Avoid religious references.
                    Do not include any introductory text, commentary, quotation marks or ending period.
                    Just return the affirmation text itself.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up the response (remove quotes if present)
    return text.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate a related positive affirmation
 */
async function generateRelatedAffirmation(previousAffirmation, apiKey) {
  try {
    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the generative model (Gemini)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 1.15,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
    });

    // Construct prompt with previous affirmation
    const prompt = `The following is a positive affirmation: "${previousAffirmation}"
                    
                    Generate a new, different positive affirmation that is thematically related to the one above.
                    The new affirmation should be a single sentence, no more than 15 words.
                    It should be written in second person (using "you").
                    Avoid religious references.
                    Do not include any introductory text, commentary, quotation marks or ending period.
                    Just return the affirmation text itself.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up the response (remove quotes if present)
    return text.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate an emotion-based affirmation
 */
async function generateEmotionBasedAffirmation(emotion, apiKey) {
  try {
    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the generative model (Gemini)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 1.15,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
    });

    // Construct prompt with emotion context
    const prompt = `The user has indicated they are feeling ${emotion}.
                    
                    Generate a single, uplifting positive affirmation that acknowledges this emotion
                    and offers encouragement appropriate for someone feeling ${emotion}.
                    The affirmation should be a single sentence, no more than 15 words.
                    It should be written in second person (using "you").
                    Avoid religious references.
                    Do not include any introductory text, commentary, quotation marks or ending period.
                    Just return the affirmation text itself.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up the response (remove quotes if present)
    return text.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate a choice-based affirmation
 */
async function generateChoiceBasedAffirmation(previousAffirmation, choice, apiKey) {
  try {
    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the generative model (Gemini)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 1.15,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
    });

    // Construct prompt with choice context
    const prompt = `Previous affirmation: "${previousAffirmation}"
                    
                    The user has chosen to explore the concept of "${choice}".
                    
                    Generate a new, different positive affirmation that builds on the previous one
                    but focuses specifically on the concept of ${choice}.
                    The new affirmation should be a single sentence, no more than 15 words.
                    It should be written in second person (using "you").
                    Avoid religious references.
                    Do not include any introductory text, commentary, quotation marks or ending period.
                    Just return the affirmation text itself.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up the response (remove quotes if present)
    return text.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
  }
}

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Generate affirmation endpoint
app.get('/api/affirmation', async (c) => {
  try {
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return c.json({ 
        error: 'GEMINI_API_KEY is not configured. Please set up your API key in the Cloudflare Worker.' 
      }, 500);
    }
    
    const affirmation = await generateAffirmation(apiKey);
    return c.json({ affirmation });
  } catch (error) {
    console.error('Error in /api/affirmation:', error);
    return c.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, 500);
  }
});

// Generate related affirmation endpoint
app.post('/api/related-affirmation', async (c) => {
  try {
    const { previousAffirmation } = await c.req.json();
    
    if (!previousAffirmation) {
      return c.json({ error: 'Previous affirmation is required' }, 400);
    }
    
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return c.json({ 
        error: 'GEMINI_API_KEY is not configured. Please set up your API key in the Cloudflare Worker.' 
      }, 500);
    }
    
    const affirmation = await generateRelatedAffirmation(previousAffirmation, apiKey);
    return c.json({ affirmation });
  } catch (error) {
    console.error('Error in /api/related-affirmation:', error);
    return c.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, 500);
  }
});

// Generate emotion-based affirmation endpoint
app.post('/api/emotion-affirmation', async (c) => {
  try {
    const { emotion } = await c.req.json();
    
    if (!emotion) {
      return c.json({ error: 'Emotion is required' }, 400);
    }
    
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return c.json({ 
        error: 'GEMINI_API_KEY is not configured. Please set up your API key in the Cloudflare Worker.' 
      }, 500);
    }
    
    const affirmation = await generateEmotionBasedAffirmation(emotion, apiKey);
    return c.json({ affirmation });
  } catch (error) {
    console.error('Error in /api/emotion-affirmation:', error);
    return c.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, 500);
  }
});

// Generate choice-based affirmation endpoint
app.post('/api/choice-affirmation', async (c) => {
  try {
    const { previousAffirmation, choice } = await c.req.json();
    
    if (!previousAffirmation || !choice) {
      return c.json({ error: 'Previous affirmation and choice are required' }, 400);
    }
    
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return c.json({ 
        error: 'GEMINI_API_KEY is not configured. Please set up your API key in the Cloudflare Worker.' 
      }, 500);
    }
    
    const affirmation = await generateChoiceBasedAffirmation(previousAffirmation, choice, apiKey);
    return c.json({ affirmation });
  } catch (error) {
    console.error('Error in /api/choice-affirmation:', error);
    return c.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, 500);
  }
});

// Export the Hono app
export default app; 