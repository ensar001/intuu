import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { callGemini } from '../services/gemini.js';

const router = express.Router();

// POST /api/ai/analyze-text - Analyze text for language learning
router.post('/analyze-text', authenticateUser, async (req, res) => {
  try {
    const { text, level, languageName, interfaceLanguageName, shouldTranslate } = req.body;

    if (!text || !languageName || !interfaceLanguageName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const systemPrompt = `
      You are an expert ${languageName} language teacher specializing in ${level.toUpperCase()} proficiency level. 
      Analyze the provided ${languageName} text for ${level.toUpperCase()} level learners.
      Provide ALL explanations and grammar terminology in ${interfaceLanguageName}.
      Return a JSON object containing a 'sentences' array. 
      For each sentence in the text, provide:
      1. 'original': the sentence text in ${languageName}.
      2. 'chunks': an array of objects breaking the sentence down. Each object has 'text' and 'type' ('normal', 'grammar', 'verb', 'case').
      3. 'grammar': an array of strings listing important grammar structures found (e.g., "Perfekt tense", "Dativ case", "modal verb") - write these explanations in ${interfaceLanguageName}.
      4. 'verbs': an array of strings listing verbs and their forms found - write these in ${interfaceLanguageName}.
      5. 'cases': an array of strings listing grammatical cases used (Nominativ, Akkusativ, Dativ, Genitiv) - write these in ${interfaceLanguageName}.
      6. 'level': estimated CEFR level (A2, B1, B2, C1, C2).
      ${shouldTranslate ? `7. 'translation': ${interfaceLanguageName} translation of the sentence.` : ''}
    `;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        sentences: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              original: { type: "STRING" },
              chunks: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    text: { type: "STRING" },
                    type: { type: "STRING" },
                    note: { type: "STRING" }
                  }
                }
              },
              grammar: { type: "ARRAY", items: { type: "STRING" } },
              verbs: { type: "ARRAY", items: { type: "STRING" } },
              cases: { type: "ARRAY", items: { type: "STRING" } },
              level: { type: "STRING" },
              translation: { type: "STRING" }
            }
          }
        }
      }
    };

    const result = await callGemini(text, systemPrompt, responseSchema);
    res.json(result);
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// POST /api/ai/generate-flashcards - Generate flashcards from topic
router.post('/generate-flashcards', authenticateUser, async (req, res) => {
  try {
    const { topic, learningLangName, interfaceLangName, translationLangName } = req.body;

    if (!topic || !learningLangName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const systemPrompt = `
      You are generating vocabulary flashcards for a ${learningLangName} language learner whose interface language is ${interfaceLangName}.
      The user provided: "${topic}"
      
      IMPORTANT: For German nouns, ALWAYS include the article (der/die/das) as part of the word.
      
      Determine the language of the input.
      - If it's a ${learningLangName} word: Create a flashcard with the ${learningLangName} word on the front (including article for German nouns), and on the back provide the ${translationLangName} translation plus 2 example sentences in ${learningLangName} using that word.
      - If it's NOT a ${learningLangName} word: Translate it to ${learningLangName} (including article for German nouns) and put the ${learningLangName} translation on the front, and on the back provide the ${translationLangName} translation plus 2 example sentences in ${learningLangName} using the word.
      
      Return JSON with a 'cards' array containing 1 flashcard object with:
      'front': the ${learningLangName} word or phrase (WITH article for German nouns like "der Tisch", "die Katze", "das Buch").
      'translation': the ${translationLangName} translation.
      'examples': an array of exactly 2 ${learningLangName} sentences using the word.
    `;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        cards: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              front: { type: "STRING" },
              translation: { type: "STRING" },
              examples: { type: "ARRAY", items: { type: "STRING" } }
            }
          }
        }
      }
    };

    const result = await callGemini(topic, systemPrompt, responseSchema);
    res.json(result);
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// POST /api/ai/tutor-chat - Language tutor conversation
router.post('/tutor-chat', authenticateUser, async (req, res) => {
  try {
    const { userInput, conversationHistory, languageName } = req.body;

    if (!userInput || !languageName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const systemPrompt = `
      You are a helpful and encouraging ${languageName} language tutor.
      The user is a learner, and you have access to the full conversation history.
      Read the conversation context carefully and respond accordingly.
      
      Return your result STRICTLY as JSON matching the provided schema. Do not include markdown.
      Tasks:
      1) Analyze the user's latest input for grammar and vocabulary errors.
      2) If there are errors, provide a corrected version.
      3) Suggest an improved version that sounds more natural or advanced.
      4) Give a brief explanation of what was corrected and why.
      5) Provide an encouraging reply that continues the conversation naturally.
      
      If the user's sentence is already perfect, acknowledge that and still provide suggestions for variety or style.
    `;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        corrected: { type: "STRING" },
        improved: { type: "STRING" },
        explanation: { type: "STRING" },
        reply: { type: "STRING" }
      }
    };

    const result = await callGemini(userInput, systemPrompt, responseSchema, conversationHistory || []);
    res.json(result);
  } catch (error) {
    console.error('Tutor chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

export default router;
