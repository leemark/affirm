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
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
    });

    // Construct prompt
    const prompt = `Generate a single, profound piece of wisdom that blends these philosophical styles:
                    1. Tolkien-style wisdom (journeys, light in darkness, ancient strength)
                    2. Kahlil Gibran poetic prose from "The Prophet" (metaphorical language, balance of opposites)
                    3. Cognitive Behavioral Therapy concepts (thought patterns, challenging beliefs)
                    
                    The wisdom should be a single sentence, 10-20 words.
                    It should be written in second person (using "you").
                    Make it deep, insightful, and timeless.
                    For Tolkien elements, you might reference journeys, paths, ancient wisdom, or light in darkness.
                    For Kahlil Gibran elements, use rich metaphorical language and balance opposites like joy/sorrow.
                    For CBT elements, include insights about how thoughts shape reality or questioning limiting beliefs.
                    
                    Use clear, straightforward sentence structure for better readability.
                    Avoid obvious character references or direct quotes, just capture the essence of these styles.
                    Avoid religious references.
                    Do not include any introductory text, commentary, quotation marks or ending period.
                    Just return the wisdom text itself.`;

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
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
    });

    // Construct prompt with previous affirmation
    const prompt = `The following is a piece of wisdom: "${previousAffirmation}"
                    
                    Generate a new, different piece of profound wisdom that is thematically related to the one above,
                    but takes the insight deeper or illuminates a different aspect of the same truth.
                    
                    Blend these philosophical styles:
                    1. Tolkien-style wisdom (journeys, light in darkness, ancient strength)
                    2. Kahlil Gibran poetic prose from "The Prophet" (metaphorical language, balance of opposites)
                    3. Cognitive Behavioral Therapy concepts (thought patterns, challenging beliefs)
                    
                    The wisdom should be a single sentence, 10-20 words.
                    It should be written in second person (using "you").
                    Make it deep, insightful, and timeless.
                    For Tolkien elements, you might reference journeys, paths, ancient wisdom, or light in darkness.
                    For Kahlil Gibran elements, use rich metaphorical language and balance opposites like joy/sorrow.
                    For CBT elements, include insights about how thoughts shape reality or questioning limiting beliefs.
                    
                    Use clear, straightforward sentence structure for better readability.
                    Avoid obvious character references or direct quotes, just capture the essence of these styles.
                    Avoid religious references.
                    Do not include any introductory text, commentary, quotation marks or ending period.
                    Just return the wisdom text itself.`;

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
async function generateEmotionBasedAffirmation(emotion, storyContext = {}) {
  try {
    const { chapter, location, guide, attributes = {} } = storyContext;
    
    // Build narrative context for the prompt
    let narrativeContext = '';
    if (chapter && location && guide) {
      narrativeContext = `
The user is currently in Chapter ${chapter} of their journey.
They are at the location "${location}" with the guide "${guide}".
Their character attributes are: 
- Wisdom: ${attributes.wisdom || 0}
- Courage: ${attributes.courage || 0}
- Compassion: ${attributes.compassion || 0}
- Resilience: ${attributes.resilience || 0}
`;
    }

    const prompt = `Generate a profound, wise affirmation for someone feeling ${emotion}.
${narrativeContext}
The affirmation should:
1. Relate to their current emotional state of feeling ${emotion}
2. Incorporate wisdom that aligns with their current location "${location || 'unknown'}" and guide "${guide || 'unknown'}"
3. If the user is in a forest location, include subtle nature imagery
4. If the user is at a mountain, include elevation or perspective themes
5. If the user is at a river, include flow or change metaphors
6. If the user is at a cave, include introspection or inner wisdom themes
7. Blend philosophical styles from Tolkien (journeys, light in darkness) and Kahlil Gibran (poetic prose, metaphorical language)
8. Include subtle Cognitive Behavioral Therapy concepts where appropriate
9. Keep it between 10-20 words for maximum impact
10. Use second-person perspective (you/your)
11. Do not use overt references to the story world, but subtly align with it

The affirmation should feel like wisdom from the guide character that's relevant to both their emotional state and their journey location.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up and format the response
    text = text.replace(/^["']|["']$/g, '').trim();
    
    return text;
  } catch (error) {
    console.error("Error generating emotion-based affirmation:", error);
    return "Your journey through emotions reveals hidden wisdom within you.";
  }
}

/**
 * Generate a choice-based affirmation
 */
async function generateChoiceBasedAffirmation(currentAffirmation, choice, choiceHistory = [], storyContext = {}) {
  try {
    const { chapter, location, guide, attributes = {} } = storyContext;
    
    // Build narrative context for the prompt
    let narrativeContext = '';
    if (chapter && location && guide) {
      narrativeContext = `
The user is currently in Chapter ${chapter} of their journey.
They are at the location "${location}" with the guide "${guide}".
Their character attributes are: 
- Wisdom: ${attributes.wisdom || 0}
- Courage: ${attributes.courage || 0}
- Compassion: ${attributes.compassion || 0}
- Resilience: ${attributes.resilience || 0}

The user just chose the path of "${choice}" which relates to the attribute of ${choice === 'strength' || choice === 'courage' ? 'courage' : 
                                choice === 'growth' || choice === 'balance' || choice === 'perseverance' ? 'resilience' : 
                                choice === 'peace' || choice === 'compassion' ? 'compassion' : 
                                'wisdom'}.
`;
    }

    // Analyze previous choices for context
    let choiceContext = '';
    if (choiceHistory && choiceHistory.length > 0) {
      choiceContext = `The user's previous choices were: ${choiceHistory.join(', ')}.`;
    }

    const prompt = `Generate a profound, wise affirmation as the next step in a user's journey.

${narrativeContext}
${choiceContext}

Their previous affirmation was: "${currentAffirmation}"
They chose the path of "${choice}" in response.

The new affirmation should:
1. Feel like a natural continuation from their previous affirmation
2. Honor and reflect their choice of "${choice}"
3. Incorporate wisdom that aligns with their current location "${location || 'unknown'}" and guide "${guide || 'unknown'}"
4. If appropriate based on location, incorporate subtle elements of that environment:
   - Forest: growth, renewal, interconnection
   - Mountain: perspective, achievement, clarity
   - River: change, flow, adaptation
   - Cave: introspection, hidden depths, inner truth
   - Meadow: peace, harmony, simplicity
   - Lighthouse: guidance, hope, illumination
5. Blend philosophical styles from Tolkien (journeys, light in darkness) and Kahlil Gibran (poetic prose, metaphorical language)
6. Include subtle Cognitive Behavioral Therapy concepts where appropriate
7. Keep it between 10-20 words for maximum impact
8. Use second-person perspective (you/your)
9. Make the affirmation feel like it comes from the guide character, without explicitly mentioning them

The affirmation should feel like the next step in their narrative journey.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up and format the response
    text = text.replace(/^["']|["']$/g, '').trim();
    
    return text;
  } catch (error) {
    console.error("Error generating choice-based affirmation:", error);
    return "The path you've chosen reveals new horizons; trust in your journey.";
  }
}

/**
 * Generate interactive elements based on user's path
 */
async function generateInteractiveElements(previousAffirmation, userPath = {}, storyContext = {}) {
  try {
    const { chapter, location, guide, attributes = {} } = storyContext || {};
    
    // Define options that align with specific attributes to help with story progression
    const attributeOptions = {
      wisdom: ['truth', 'wisdom', 'knowledge', 'insight'],
      courage: ['strength', 'courage', 'bravery', 'action'],
      compassion: ['peace', 'compassion', 'kindness', 'harmony'],
      resilience: ['growth', 'resilience', 'perseverance', 'balance']
    };
    
    // Find which attributes need development based on current levels
    let lowestAttributes = [];
    if (attributes && Object.keys(attributes).length > 0) {
      // Get the lowest attribute(s)
      const min = Math.min(...Object.values(attributes));
      lowestAttributes = Object.entries(attributes)
        .filter(([_, value]) => value === min)
        .map(([key, _]) => key);
    }
    
    // Randomly select options aligned with attributes that need development
    let optionChoices = [];
    if (lowestAttributes.length > 0) {
      // Prioritize options that would help develop lower attributes
      for (const attr of lowestAttributes) {
        if (attributeOptions[attr]) {
          optionChoices = [...optionChoices, ...attributeOptions[attr]];
        }
      }
    }
    
    // If we don't have enough options yet, add more from other attributes
    if (optionChoices.length < 4) {
      for (const [attr, options] of Object.entries(attributeOptions)) {
        if (!lowestAttributes.includes(attr)) {
          optionChoices = [...optionChoices, ...options];
        }
      }
    }
    
    // Shuffle and select two distinct options
    const shuffled = optionChoices.sort(() => 0.5 - Math.random());
    const [optionA, optionB] = [shuffled[0], shuffled[1]];
    
    // Generate appropriate question based on location and context
    let question = "Which path would you like to explore next?";
    
    if (location) {
      const locationQuestions = {
        'beginning': ["Which aspect of your journey calls to you?", "What would you like to discover first?"],
        'forest': ["Which path through the forest speaks to you?", "What wisdom do you seek among the trees?"],
        'mountain': ["What clarity do you seek from this vantage point?", "Which perspective draws you forward?"],
        'river': ["Where would you like the current to carry you?", "Which flow of wisdom calls to you now?"], 
        'cave': ["What hidden truth would you like to uncover?", "Which shadow would you like to explore?"],
        'meadow': ["What harmony would you like to cultivate?", "Which peaceful insight draws you forward?"],
        'lighthouse': ["What guiding light would you follow?", "Which beacon calls to you now?"]
      };
      
      const options = locationQuestions[location] || ["Which path would you like to explore next?"];
      question = options[Math.floor(Math.random() * options.length)];
    }
    
    // Generate friendly, descriptive labels for the options
    const optionADesc = getOptionDescription(optionA);
    const optionBDesc = getOptionDescription(optionB);
    
    return {
      question: question,
      optionA: optionADesc,
      optionAId: optionA,
      optionB: optionBDesc,
      optionBId: optionB
    };
  } catch (error) {
    console.error("Error generating interactive elements:", error);
    // Return default options on error
    return {
      question: "Which path would you like to explore next?",
      optionA: "Inner strength",
      optionAId: "strength",
      optionB: "Self-compassion",
      optionBId: "compassion"
    };
  }
}

// Helper function to generate descriptive labels
function getOptionDescription(optionId) {
  const descriptions = {
    'truth': 'Seek truth',
    'wisdom': 'Cultivate wisdom',
    'knowledge': 'Gain knowledge',
    'insight': 'Deepen insight',
    'strength': 'Build strength',
    'courage': 'Find courage',
    'bravery': 'Embrace bravery',
    'action': 'Take action',
    'peace': 'Nurture peace',
    'compassion': 'Practice compassion',
    'kindness': 'Extend kindness',
    'harmony': 'Create harmony',
    'growth': 'Pursue growth',
    'resilience': 'Develop resilience',
    'perseverance': 'Show perseverance',
    'balance': 'Find balance'
  };
  
  return descriptions[optionId] || `Explore ${optionId}`;
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
    const body = await c.req.json();
    const { emotion, storyContext } = body;
    
    if (!emotion) {
      return c.json({ error: 'Emotion is required' }, 400);
    }
    
    // Validate emotion
    const validEmotions = ['joy', 'sadness', 'fear', 'anger', 'surprise', 'disgust', 'neutral', 'gratitude', 'hope', 'peace', 'anxiety', 'love'];
    if (!validEmotions.includes(emotion.toLowerCase())) {
      return c.json({ error: 'Invalid emotion provided' }, 400);
    }
    
    const affirmation = await generateEmotionBasedAffirmation(emotion, storyContext || {});
    return c.json({ affirmation });
  } catch (error) {
    console.error('Error in emotion-affirmation endpoint:', error);
    return c.json({ 
      error: error.message || 'An unexpected error occurred',
      affirmation: "In moments of uncertainty, the wisest path is to breathe and trust yourself."
    });
  }
});

// Generate choice-based affirmation endpoint
app.post('/api/choice-affirmation', async (c) => {
  try {
    const body = await c.req.json();
    const { currentAffirmation, choice, choiceHistory, storyContext } = body;
    
    if (!currentAffirmation || !choice) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }
    
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return c.json({ 
        error: 'GEMINI_API_KEY is not configured. Please set up your API key in the Cloudflare Worker.' 
      }, 500);
    }
    
    const affirmation = await generateChoiceBasedAffirmation(
      currentAffirmation, 
      choice, 
      choiceHistory || [], 
      storyContext || {}
    );
    
    return c.json({ affirmation });
  } catch (error) {
    console.error('Error in choice-affirmation endpoint:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Generate interactive elements endpoint
app.post('/api/interactive-elements', async (c) => {
  try {
    const body = await c.req.json();
    const { previousAffirmation, userPath, storyContext } = body;
    
    // Generate interactive elements based on context
    const elements = await generateInteractiveElements(
      previousAffirmation, 
      userPath || {}, 
      storyContext || {}
    );
    
    return c.json(elements);
  } catch (error) {
    console.error('Error in interactive-elements endpoint:', error);
    return c.json({
      question: "Which path would you like to explore next?",
      optionA: "Inner strength",
      optionAId: "strength",
      optionB: "Self-compassion",
      optionBId: "compassion"
    });
  }
});

// Export the Hono app
export default app; 