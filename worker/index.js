/**
 * Affirm - Cloudflare Worker for generating positive affirmations
 * 
 * This worker uses the Gemini API to generate positive affirmations
 * and provide context-aware follow-up affirmations.
 */

// Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Handle requests
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: CORS_HEADERS
      });
    }
    
    // Handle API routes
    const url = new URL(request.url);
    
    if (url.pathname === '/api/affirmation') {
      return this.generateAffirmation(request, env);
    } else if (url.pathname === '/api/related-affirmation') {
      return this.generateRelatedAffirmation(request, env);
    }
    
    // Default response for unmatched routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_HEADERS
    });
  },
  
  async generateAffirmation(request, env) {
    try {
      const prompt = `Generate a single, brief positive affirmation that is uplifting and encouraging.
                      The affirmation should be a single sentence, no more than 15 words.
                      It should be written in second person (using "you").
                      Avoid religious references.
                      Do not include any introductory text, commentary, quotation marks or ending period.
                      Just return the affirmation text itself.`;
      
      const affirmation = await this.callGeminiAPI(prompt, env.GEMINI_API_KEY);
      
      return new Response(JSON.stringify({ affirmation }), {
        headers: CORS_HEADERS
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  },
  
  async generateRelatedAffirmation(request, env) {
    try {
      // Get previous affirmation from request body
      const { previousAffirmation } = await request.json();
      
      if (!previousAffirmation) {
        return new Response(JSON.stringify({ error: 'Previous affirmation is required' }), {
          status: 400,
          headers: CORS_HEADERS
        });
      }
      
      const prompt = `The following is a positive affirmation: "${previousAffirmation}"
                      
                      Generate a new, different positive affirmation that is thematically related to the one above.
                      The new affirmation should be a single sentence, no more than 15 words.
                      It should be written in second person (using "you").
                      Avoid religious references.
                      Do not include any introductory text, commentary, quotation marks or ending period.
                      Just return the affirmation text itself.`;
      
      const affirmation = await this.callGeminiAPI(prompt, env.GEMINI_API_KEY);
      
      return new Response(JSON.stringify({ affirmation }), {
        headers: CORS_HEADERS
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  },
  
  async callGeminiAPI(prompt, apiKey) {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    
    // Extract the text from the response
    const affirmation = data.candidates[0].content.parts[0].text.trim();
    
    // Clean up the response (remove quotes if present)
    return affirmation.replace(/^["']|["']$/g, '');
  }
}; 