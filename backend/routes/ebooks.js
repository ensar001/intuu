import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as deepl from 'deepl-node';

const router = express.Router();

/**
 * POST /api/translate
 * Translate text using DeepL API
 */
router.post('/translate', authenticateUser, async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ 
        error: 'Missing required fields: text and targetLanguage' 
      });
    }

    // Limit text length for safety
    if (text.length > 5000) {
      return res.status(400).json({ 
        error: 'Text is too long. Maximum 5000 characters allowed.' 
      });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    
    if (!apiKey || apiKey === 'your_deepl_api_key_here') {
      return res.status(500).json({
        error: 'DeepL API key is not configured. Get your free API key from https://www.deepl.com/pro-api and add it to backend/.env as DEEPL_API_KEY'
      });
    }

    // Initialize DeepL client
    const translator = new deepl.Translator(apiKey);

    // DeepL requires specific variants for English (en-US or en-GB) and Portuguese (pt-PT or pt-BR)
    let targetLang = targetLanguage.toUpperCase();
    if (targetLang === 'EN') {
      targetLang = 'EN-US'; // Default to US English
    } else if (targetLang === 'PT') {
      targetLang = 'PT-BR'; // Default to Brazilian Portuguese
    }
    
    const sourceLang = sourceLanguage ? sourceLanguage.toUpperCase() : null;

    // Translate text
    const result = await translator.translateText(text, sourceLang, targetLang);

    res.json({ 
      translation: result.text,
      sourceLanguage: sourceLanguage || result.detectedSourceLang.toLowerCase(),
      targetLanguage,
    });

  } catch (error) {
    console.error('Translation error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Translation failed. Please try again.',
      details: error.message 
    });
  }
});

export default router;
