import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 Load all available API keys from environment
const API_KEYS = [
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
].filter(Boolean); // Remove undefined keys

console.log(`🔑 Loaded ${API_KEYS.length} API key(s)`);

// ✅ Model that works with free tier
const MODEL = "gemini-2.0-flash-exp";

// Track which keys have hit rate limits (resets every 24 hours)
const exhaustedKeys = new Set();

/**
 * Generate content with automatic key rotation and model fallback
 * Tries all available API keys when one hits rate limit
 * 
 * @param {string} prompt - The prompt to send to the model
 * @param {object} generationConfig - Generation config (temperature, etc)
 * @returns {Promise<string>} - The generated text response
 */
export async function generateWithFallback(prompt, generationConfig = {}) {
  let lastError = null;
  
  // Try each API key
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    const keyNumber = i + 1;
    
    // Skip keys that are already exhausted
    if (exhaustedKeys.has(apiKey)) {
      console.log(`⏭️ Skipping API key #${keyNumber} (already exhausted)`);
      continue;
    }
    
    try {
      console.log(`🔑 Trying API key #${keyNumber}/${API_KEYS.length} with model: ${MODEL}`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: MODEL,
        generationConfig
      });
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log(`✅ Success with API key #${keyNumber}!`);
      return responseText;
      
    } catch (error) {
      console.log(`❌ Failed with API key #${keyNumber}:`, error.message);
      lastError = error;
      
      // If it's a rate limit error, mark this key as exhausted and try next
      if (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('Too Many Requests')
      ) {
        console.log(`⏭️ Rate limit hit on API key #${keyNumber}, marking as exhausted and trying next key...`);
        exhaustedKeys.add(apiKey);
        continue;
      }
      
      // If it's a 404 (model not found), skip to next key
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`⏭️ Model not available for API key #${keyNumber}, trying next key...`);
        continue;
      }
      
      // If it's another error type, throw immediately
      throw error;
    }
  }
  
  // If all keys failed
  console.error('❌ All API keys exhausted!');
  console.error(`💡 Total keys tried: ${API_KEYS.length}`);
  console.error(`💡 Exhausted keys: ${exhaustedKeys.size}`);
  console.error('💡 TIP: Wait 24 hours for quota reset, or add more API keys to .env.local');
  console.error('💡 To add more keys: GOOGLE_API_KEY_2, GOOGLE_API_KEY_3, etc.');
  
  throw lastError;
}

/**
 * Generate JSON content with automatic key rotation
 * Same as generateWithFallback but automatically parses JSON
 * 
 * @param {string} prompt - The prompt to send to the model
 * @param {object} generationConfig - Generation config (temperature, etc)
 * @returns {Promise<object>} - The parsed JSON response
 */
export async function generateJSONWithFallback(prompt, generationConfig = {}) {
  // Ensure JSON response type is set
  const config = {
    ...generationConfig,
    responseMimeType: "application/json"
  };
  
  const responseText = await generateWithFallback(prompt, config);
  return JSON.parse(responseText);
}

/**
 * Reset exhausted keys (call this manually if needed, or on server restart)
 * Useful for testing or when you know quotas have reset
 */
export function resetExhaustedKeys() {
  console.log('🔄 Resetting exhausted keys tracker');
  exhaustedKeys.clear();
}

/**
 * Get statistics about key usage
 */
export function getKeyStats() {
  return {
    totalKeys: API_KEYS.length,
    exhaustedKeys: exhaustedKeys.size,
    availableKeys: API_KEYS.length - exhaustedKeys.size
  };
}