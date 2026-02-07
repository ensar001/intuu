import express from 'express';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { authenticateUser } from '../middleware/auth.js';
import { audioCache } from '../services/audioCache.js';
import { splitIntoSentences } from '../utils/text.js';

const router = express.Router();

// Use authenticateUser as authMiddleware alias for consistency
const authMiddleware = authenticateUser;

// Lazy initialization of AWS Polly client
let pollyClient = null;

const getPollyClient = () => {
  if (!pollyClient) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
    }
    
    pollyClient = new PollyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log('[TTS] Polly client initialized with region:', process.env.AWS_REGION || 'us-east-1');
  }
  return pollyClient;
};

// Voice mapping for different languages
const VOICE_MAP = {
  'de': 'Vicki',      // German female voice (neural)
  'en': 'Joanna',     // English US female voice (neural)
  'tr': 'Filiz',      // Turkish female voice (standard)
  'fr': 'Lea',        // French female voice (neural)
  'es': 'Lucia',      // Spanish female voice (neural)
  'it': 'Bianca',     // Italian female voice (neural)
  'pt': 'Ines',       // Portuguese female voice (neural)
  'ru': 'Tatyana',    // Russian female voice (standard)
  'zh': 'Zhiyu',      // Chinese Mandarin female voice (neural)
  'ja': 'Mizuki',     // Japanese female voice (standard)
  'ko': 'Seoyeon',    // Korean female voice (standard)
  'ar': 'Zeina'       // Arabic female voice (standard)
};

// Engine type mapping (neural voices are higher quality)
const ENGINE_MAP = {
  'de': 'neural',
  'en': 'neural',
  'tr': 'standard',
  'fr': 'neural',
  'es': 'neural',
  'it': 'neural',
  'pt': 'neural',
  'ru': 'standard',
  'zh': 'neural',
  'ja': 'standard',
  'ko': 'standard',
  'ar': 'standard'
};

const escapeXml = (value) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const normalizeTtsText = (text = '') => {
  return text
    // Replace ellipses or spaced dots to avoid "punkt punkt punkt"
    .replace(/\s*\.\s*\.\s*\.+/g, '.')
    .replace(/…/g, '.')
    // Collapse repeated punctuation
    .replace(/([!?.,;:]){2,}/g, '$1')
    // Remove standalone punctuation tokens
    .replace(/(^|\s)[,;:!?]+(?=\s|$)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const buildSsml = (text) => {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean);

  const parts = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const sentences = splitIntoSentences(paragraph)
      .map(sentence => sentence.trim())
      .filter(Boolean);

    if (!sentences.length) {
      return;
    }

    const sentenceParts = sentences.map((sentence) => {
      return `<s>${escapeXml(sentence)}</s>`;
    });

    parts.push(`<p>${sentenceParts.join('<break time="250ms"/>')}</p>`);

    if (paragraphIndex < paragraphs.length - 1) {
      parts.push('<break time="400ms"/>');
    }
  });

  return `<speak>${parts.join('')}</speak>`;
};

/**
 * POST /api/tts/synthesize
 * 
 * Synthesize text to speech using Amazon Polly with caching
 * Request body:
 * - text: string (max 3000 characters for standard, 600 for neural)
 * - language: string (ISO language code: 'de', 'en', etc.)
 * - voiceId: string (optional, override default voice)
 * 
 * Returns: JSON with audioUrl and cached flag
 */
router.post('/synthesize', authMiddleware, async (req, res) => {
  try {
    const { text, language = 'de', voiceId } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }

    // Generate cache key
    const cacheKey = audioCache.generateCacheKey(text, language);

    // Check if audio is already cached
    const { exists, url } = await audioCache.checkCache(cacheKey, userToken);
    
    if (exists && url) {
      console.log(`[TTS] Cache HIT: ${cacheKey}`);
      return res.json({ 
        audioUrl: url, 
        cached: true,
        cacheKey 
      });
    }

    console.log(`[TTS] Cache MISS: ${cacheKey}`);

    // Get voice and engine for language
    const voice = voiceId || VOICE_MAP[language] || 'Joanna';
    const engine = ENGINE_MAP[language] || 'standard';

    const cleanedText = normalizeTtsText(text);

    // Check text length based on engine type
    const maxLength = engine === 'neural' ? 600 : 3000;
    if (cleanedText.length > maxLength) {
      return res.status(400).json({
        error: `Text too long. Maximum ${maxLength} characters for ${engine} voices.`,
        maxLength
      });
    }

    const ssml = buildSsml(cleanedText);

    // Prepare Polly command
    const command = new SynthesizeSpeechCommand({
      Text: ssml,
      OutputFormat: 'mp3',
      VoiceId: voice,
      Engine: engine,
      TextType: 'ssml',
      SampleRate: '24000'
    });

    console.log(`[TTS] Synthesizing: ${text.substring(0, 50)}... (${language}, ${voice}, ${engine})`);

    // Execute Polly command
    const client = getPollyClient();
    let response;

    try {
      response = await client.send(command);
    } catch (error) {
      if (error?.name === 'InvalidSsmlException') {
        console.warn('[TTS] Invalid SSML, retrying with plain text');
        const fallbackCommand = new SynthesizeSpeechCommand({
          Text: cleanedText,
          OutputFormat: 'mp3',
          VoiceId: voice,
          Engine: engine,
          TextType: 'text',
          SampleRate: '24000'
        });
        response = await client.send(fallbackCommand);
      } else {
        throw error;
      }
    }

    // Convert audio stream to buffer
    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Store in cache
    const { success, url: cachedUrl, error: cacheError } = await audioCache.storeAudio(cacheKey, audioBuffer, userToken);

    if (!success) {
      console.error('[TTS] Failed to cache audio:', cacheError);
      // Still return the audio even if caching fails
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
        'Cache-Control': 'public, max-age=3600'
      });
      return res.send(audioBuffer);
    }

    // Return cached URL
    res.json({ 
      audioUrl: cachedUrl, 
      cached: false,
      cacheKey,
      size: audioBuffer.length 
    });

  } catch (error) {
    console.error('[TTS] Synthesis error:', error);
    
    // Handle AWS-specific errors
    if (error.name === 'InvalidParameterException') {
      return res.status(400).json({ 
        error: 'Invalid parameters',
        message: error.message 
      });
    }
    
    if (error.name === 'ThrottlingException') {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to synthesize speech',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/tts/voices
 * 
 * Get available voices for a language
 */
router.get('/voices', authMiddleware, (req, res) => {
  const { language } = req.query;

  if (language && VOICE_MAP[language]) {
    res.json({
      language,
      voice: VOICE_MAP[language],
      engine: ENGINE_MAP[language],
      available: true
    });
  } else if (language) {
    res.json({
      language,
      voice: 'Joanna',
      engine: 'neural',
      available: false,
      message: 'Language not supported, using default voice'
    });
  } else {
    res.json({
      voices: VOICE_MAP,
      engines: ENGINE_MAP
    });
  }
});

/**
 * POST /api/tts/synthesize-chunked
 * 
 * Synthesize longer text by splitting into chunks with caching
 * Request body:
 * - text: string (any length)
 * - language: string
 * 
 * Returns: JSON with audioUrl and cached flag
 */
router.post('/synthesize-chunked', authMiddleware, async (req, res) => {
  try {
    const { text, language = 'de' } = req.body;
    const userToken = req.headers.authorization?.replace('Bearer ', '');

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Text is required and must be a string' 
      });
    }

    // Generate cache key for entire text
    const cacheKey = audioCache.generateCacheKey(text, language);

    // Check if audio is already cached
    const { exists, url } = await audioCache.checkCache(cacheKey, userToken);
    
    if (exists && url) {
      console.log(`[TTS] Cache HIT (chunked): ${cacheKey}`);
      
      // Also retrieve cached speech marks
      const { success: marksSuccess, speechMarks: cachedMarks } = await audioCache.getSpeechMarks(cacheKey, userToken);
      console.log(`[TTS] Speech marks retrieval: success=${marksSuccess}, count=${cachedMarks?.length || 0}`);
      
      return res.json({ 
        audioUrl: url, 
        cached: true,
        cacheKey,
        speechMarks: cachedMarks || [],
        sentences: [] // Not stored in cache, but marks have value field
      });
    }

    console.log(`[TTS] Cache MISS (chunked): ${cacheKey} - Generating...`);

    const voice = VOICE_MAP[language] || 'Joanna';
    const engine = ENGINE_MAP[language] || 'standard';
    const maxLength = engine === 'neural' ? 450 : 2500; // Leave buffer for SSML tags

    const cleanedText = normalizeTtsText(text);

    // Split text into sentences
    const sentences = splitIntoSentences(cleanedText);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const sentenceText = sentence.trim();
      if (!sentenceText) continue;

      const candidate = currentChunk ? `${currentChunk} ${sentenceText}` : sentenceText;
      if (candidate.length <= maxLength) {
        currentChunk = candidate;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentenceText;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    console.log(`[TTS] Processing ${chunks.length} chunks for ${language}`);

    // Synthesize each chunk (audio + speech marks)
    const audioBuffers = [];
    const allSpeechMarks = [];
    const client = getPollyClient();
    let cumulativeTimeOffset = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      // Generate audio
      const audioCommand = new SynthesizeSpeechCommand({
        Text: buildSsml(chunks[i]),
        OutputFormat: 'mp3',
        VoiceId: voice,
        Engine: engine,
        TextType: 'ssml',
        SampleRate: '24000'
      });

      let audioResponse;
      try {
        audioResponse = await client.send(audioCommand);
      } catch (error) {
        if (error?.name === 'InvalidSsmlException') {
          console.warn('[TTS] Invalid SSML for audio, retrying with plain text');
          const fallbackAudioCommand = new SynthesizeSpeechCommand({
            Text: chunks[i],
            OutputFormat: 'mp3',
            VoiceId: voice,
            Engine: engine,
            TextType: 'text',
            SampleRate: '24000'
          });
          audioResponse = await client.send(fallbackAudioCommand);
        } else {
          throw error;
        }
      }
      const chunkBuffers = [];
      for await (const chunk of audioResponse.AudioStream) {
        chunkBuffers.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunkBuffers);
      audioBuffers.push(audioBuffer);

      // Generate speech marks (timing data)
      const marksCommand = new SynthesizeSpeechCommand({
        Text: buildSsml(chunks[i]),
        OutputFormat: 'json',
        VoiceId: voice,
        Engine: engine,
        TextType: 'ssml',
        SpeechMarkTypes: ['sentence']
      });

      let marksResponse;
      try {
        marksResponse = await client.send(marksCommand);
      } catch (error) {
        if (error?.name === 'InvalidSsmlException') {
          console.warn('[TTS] Invalid SSML for speech marks, retrying with plain text');
          const fallbackMarksCommand = new SynthesizeSpeechCommand({
            Text: chunks[i],
            OutputFormat: 'json',
            VoiceId: voice,
            Engine: engine,
            TextType: 'text',
            SpeechMarkTypes: ['sentence']
          });
          marksResponse = await client.send(fallbackMarksCommand);
        } else {
          throw error;
        }
      }
      const marksBuffers = [];
      for await (const chunk of marksResponse.AudioStream) {
        marksBuffers.push(chunk);
      }
      const marksText = Buffer.concat(marksBuffers).toString('utf-8');
      
      // Parse speech marks (newline-delimited JSON)
      const rawMarks = marksText
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      const chunkDuration = rawMarks.length
        ? rawMarks[rawMarks.length - 1].time + 500 // Polly marks are real times; add small pad
        : Math.max(((chunks[i].length / 5) / 150) * 60 * 1000, 500);

      const marks = rawMarks.map(mark => ({
        ...mark,
        time: mark.time + cumulativeTimeOffset // Adjust for chunk offset
      }));

      allSpeechMarks.push(...marks);
      cumulativeTimeOffset += chunkDuration;
    }

    console.log(`[TTS] Generated ${allSpeechMarks.length} sentence timing marks`);

    // Concatenate all audio buffers
    const finalAudio = Buffer.concat(audioBuffers);

    // Store in cache
    const { success, url: cachedUrl, error: cacheError } = await audioCache.storeAudio(cacheKey, finalAudio, userToken);

    // Also store speech marks
    if (success) {
      await audioCache.storeSpeechMarks(cacheKey, allSpeechMarks, userToken);
    }

    if (!success) {
      console.error('[TTS] Failed to cache audio:', cacheError);
      // Still return the audio even if caching fails
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
        'Cache-Control': 'public, max-age=3600'
      });
      return res.send(finalAudio);
    }

    // Return cached URL with timing data AND sentence texts for precise highlighting
    res.json({ 
      audioUrl: cachedUrl, 
      cached: false,
      cacheKey,
      chunks: chunks.length,
      size: finalAudio.length,
      speechMarks: allSpeechMarks, // Include timing data
      sentences: sentences // Include exact sentence texts used for TTS
    });

  } catch (error) {
    console.error('[TTS] Chunked synthesis error:', error);
    res.status(500).json({ 
      error: 'Failed to synthesize speech',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/tts/cache/stats
 * 
 * Get cache statistics
 */
router.get('/cache/stats', authMiddleware, async (req, res) => {
  try {
    const { language } = req.query;
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    const stats = await audioCache.getStats(language, userToken);
    
    res.json({
      ...stats,
      totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2)
    });
  } catch (error) {
    console.error('[TTS] Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * DELETE /api/tts/cache/:language?
 * 
 * Clear cache for a specific language or all cache
 */
router.delete('/cache/:language?', authMiddleware, async (req, res) => {
  try {
    const { language } = req.params;
    const { olderThanDays } = req.query;
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (olderThanDays) {
      const { deleted, error } = await audioCache.clearOldCache(parseInt(olderThanDays), userToken);
      if (error) {
        return res.status(500).json({ error });
      }
      return res.json({ deleted, message: `Deleted ${deleted} files older than ${olderThanDays} days` });
    }
    
    // For now, just return stats (actual deletion can be implemented if needed)
    const stats = await audioCache.getStats(language, userToken);
    res.json({ 
      message: 'Use ?olderThanDays=30 to delete old files',
      currentFiles: stats.fileCount 
    });
  } catch (error) {
    console.error('[TTS] Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;
