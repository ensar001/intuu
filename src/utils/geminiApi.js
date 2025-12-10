// Rate limiting configuration
const MIN_CALL_INTERVAL = 1000; // 1 second between calls
let lastCallTime = 0;

/**
 * Delays execution to enforce rate limiting
 * @returns {Promise} Resolves when rate limit allows next call
 */
const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    const waitTime = MIN_CALL_INTERVAL - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastCallTime = Date.now();
};

/**
 * Get auth token from Supabase session
 */
const getAuthToken = async () => {
  const { supabase } = await import('./supabaseClient.js');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

/**
 * Call backend API which proxies to Gemini
 * @param {string} endpoint - Backend endpoint (/api/ai/analyze-text, /api/ai/generate-flashcards, /api/ai/tutor-chat)
 * @param {object} payload - Request payload
 */
const callBackendAI = async (endpoint, payload) => {
  await enforceRateLimit();
  
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`http://localhost:3001${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.details || errorData.error || `API Error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Analyze text for language learning
 */
export const analyzeText = async (text, level, languageName, interfaceLanguageName, shouldTranslate) => {
  return await callBackendAI('/api/ai/analyze-text', {
    text,
    level,
    languageName,
    interfaceLanguageName,
    shouldTranslate
  });
};

/**
 * Generate flashcards from topic
 */
export const generateFlashcards = async (topic, learningLangName, interfaceLangName, translationLangName) => {
  return await callBackendAI('/api/ai/generate-flashcards', {
    topic,
    learningLangName,
    interfaceLangName,
    translationLangName
  });
};

/**
 * Language tutor chat
 */
export const tutorChat = async (userInput, conversationHistory, languageName) => {
  return await callBackendAI('/api/ai/tutor-chat', {
    userInput,
    conversationHistory,
    languageName
  });
};

// Legacy function for backwards compatibility (deprecated)
export const callGemini = async (prompt, systemInstruction, responseSchema = null, conversationHistory = []) => {
  console.warn('callGemini is deprecated. Use specific functions: analyzeText, generateFlashcards, or tutorChat');
  throw new Error('Direct Gemini calls are no longer supported. Use backend API functions.');
};
