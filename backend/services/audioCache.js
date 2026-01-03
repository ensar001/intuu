import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'ebook-audio';

// Create Supabase client with user's auth token for secure uploads
const getSupabaseClient = (userToken = null) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('[AudioCache] Warning: SUPABASE_URL or SUPABASE_ANON_KEY not configured. Audio caching disabled.');
    return null;
  }
  
  // Create client with anon key and optional user token for authenticated operations
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    userToken ? {
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    } : {}
  );
  
  return client;
};

/**
 * Audio Cache Service
 * Manages TTS audio file caching in Supabase Storage
 */
export const audioCache = {
  /**
   * Generate a unique cache key from text content and language
   * @param {string} text - The text content
   * @param {string} language - Language code (e.g., 'de', 'en')
   * @returns {string} Cache key in format: 'language/hash.mp3'
   */
  generateCacheKey: (text, language) => {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return `${language}/${hash}.mp3`;
  },

  /**
   * Check if audio file exists in cache
   * @param {string} cacheKey - Cache key from generateCacheKey()
   * @param {string} userToken - Optional user JWT token for authenticated operations
   * @returns {Promise<{exists: boolean, url: string|null}>}
   */
  checkCache: async (cacheKey, userToken = null) => {
    try {
      const supabase = getSupabaseClient(userToken);
      if (!supabase) {
        return { exists: false, url: null };
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(cacheKey.split('/')[0], {
          search: cacheKey.split('/')[1]
        });

      if (error) {
        console.error('[AudioCache] Error checking cache:', error);
        return { exists: false, url: null };
      }

      if (data && data.length > 0) {
        // File exists, generate public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(cacheKey);

        return { exists: true, url: urlData.publicUrl };
      }

      return { exists: false, url: null };
    } catch (error) {
      console.error('[AudioCache] Exception checking cache:', error);
      return { exists: false, url: null };
    }
  },

  /**
   * Store audio file in cache
   * @param {string} cacheKey - Cache key from generateCacheKey()
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} userToken - User JWT token for authenticated upload
   * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
   */
  storeAudio: async (cacheKey, audioBuffer, userToken) => {
    try {
      const supabase = getSupabaseClient(userToken);
      if (!supabase) {
        return { success: false, url: null, error: 'Supabase not configured' };
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(cacheKey, audioBuffer, {
          contentType: 'audio/mpeg',
          cacheControl: '2592000', // 30 days
          upsert: false // Don't overwrite if exists
        });

      if (error) {
        console.error('[AudioCache] Error storing audio:', error);
        return { success: false, url: null, error: error.message };
      }

      // Generate public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(cacheKey);

      console.log('[AudioCache] Audio stored successfully:', cacheKey);
      return { success: true, url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('[AudioCache] Exception storing audio:', error);
      return { success: false, url: null, error: error.message };
    }
  },

  /**
   * Store speech marks JSON alongside audio
   * @param {string} cacheKey - Cache key from generateCacheKey() (will replace .mp3 with .json)
   * @param {Array} speechMarks - Speech marks array from Polly
   * @param {string} userToken - User JWT token
   */
  storeSpeechMarks: async (cacheKey, speechMarks, userToken) => {
    try {
      const supabase = getSupabaseClient(userToken);
      if (!supabase) return { success: false };

      const jsonKey = cacheKey.replace('.mp3', '.json');
      const jsonBuffer = Buffer.from(JSON.stringify(speechMarks));

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(jsonKey, jsonBuffer, {
          contentType: 'application/json',
          cacheControl: '2592000',
          upsert: true
        });

      if (error) {
        console.error('[AudioCache] Error storing speech marks:', error);
        return { success: false };
      }

      console.log('[AudioCache] Speech marks stored:', jsonKey);
      return { success: true };
    } catch (error) {
      console.error('[AudioCache] Exception storing speech marks:', error);
      return { success: false };
    }
  },

  /**
   * Retrieve speech marks from cache
   * @param {string} cacheKey - Cache key (will replace .mp3 with .json)
   * @param {string} userToken - User JWT token
   */
  getSpeechMarks: async (cacheKey, userToken) => {
    try {
      const supabase = getSupabaseClient(userToken);
      if (!supabase) return { success: false, speechMarks: [] };

      const jsonKey = cacheKey.replace('.mp3', '.json');

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(jsonKey);

      if (error) {
        console.log('[AudioCache] No cached speech marks found:', jsonKey);
        return { success: false, speechMarks: [] };
      }

      const text = await data.text();
      const speechMarks = JSON.parse(text);
      console.log('[AudioCache] Speech marks retrieved:', jsonKey, speechMarks.length, 'marks');
      return { success: true, speechMarks };
    } catch (error) {
      console.error('[AudioCache] Exception getting speech marks:', error);
      return { success: false, speechMarks: [] };
    }
  },

  /**
   * Delete audio file from cache
   * @param {string} cacheKey - Cache key to delete
   * @param {string} userToken - User JWT token for authenticated deletion
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  deleteAudio: async (cacheKey, userToken) => {
    try {
      const supabase = getSupabaseClient(userToken);
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([cacheKey]);

      if (error) {
        console.error('[AudioCache] Error deleting audio:', error);
        return { success: false, error: error.message };
      }

      console.log('[AudioCache] Audio deleted:', cacheKey);
      return { success: true, error: null };
    } catch (error) {
      console.error('[AudioCache] Exception deleting audio:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get cache statistics
   * @param {string} language - Optional language filter
   * @param {string} userToken - User JWT token for authenticated operations
   * @returns {Promise<{fileCount: number, totalSize: number, files: Array}>}
   */
  getStats: async (language = null, userToken = null) => {
    try {
      const supabase = getSupabaseClient(userToken);
      if (!supabase) {
        return { fileCount: 0, totalSize: 0, files: [] };
      }

      const folder = language || '';
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folder, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('[AudioCache] Error getting stats:', error);
        return { fileCount: 0, totalSize: 0, files: [] };
      }

      const totalSize = data.reduce((sum, file) => {
        return sum + (file.metadata?.size || 0);
      }, 0);

      return {
        fileCount: data.length,
        totalSize,
        files: data.map(f => ({
          name: f.name,
          size: f.metadata?.size || 0,
          created: f.created_at
        }))
      };
    } catch (error) {
      console.error('[AudioCache] Exception getting stats:', error);
      return { fileCount: 0, totalSize: 0, files: [] };
    }
  },

  /**
   * Clear old cache files (older than specified days)
   * @param {number} olderThanDays - Delete files older than this many days
   * @param {string} userToken - User JWT token for authenticated deletion
   * @returns {Promise<{deleted: number, error: string|null}>}
   */
  clearOldCache: async (olderThanDays = 30, userToken = null) => {
    try {
      const supabase = getSupabaseClient(userToken);
      if (!supabase) {
        return { deleted: 0, error: 'Supabase not configured' };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // List all files
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 10000 });

      if (listError) {
        return { deleted: 0, error: listError.message };
      }

      // Filter files older than cutoff
      const oldFiles = files.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < cutoffDate;
      });

      if (oldFiles.length === 0) {
        return { deleted: 0, error: null };
      }

      // Delete old files
      const filePaths = oldFiles.map(f => f.name);
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        return { deleted: 0, error: deleteError.message };
      }

      console.log(`[AudioCache] Deleted ${oldFiles.length} old cache files`);
      return { deleted: oldFiles.length, error: null };
    } catch (error) {
      console.error('[AudioCache] Exception clearing cache:', error);
      return { deleted: 0, error: error.message };
    }
  }
};

export default audioCache;
