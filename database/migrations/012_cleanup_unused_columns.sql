-- Clean up unnecessary and unused columns from database schema
-- This removes fields that were never implemented or are redundant

-- Remove XP column from profiles (gamification never implemented)
ALTER TABLE profiles 
DROP COLUMN IF EXISTS xp;

-- Remove audio_url from cards (feature never implemented, TTS is per-page not per-card)
ALTER TABLE cards
DROP COLUMN IF EXISTS audio_url;

-- Remove bookmarks from user_books (feature not implemented in UI)
ALTER TABLE user_books
DROP COLUMN IF EXISTS bookmarks;

-- Remove review_count from learned_words (redundant with mastery_level tracking)
ALTER TABLE learned_words
DROP COLUMN IF EXISTS review_count;

-- Note: words_mastered counter in profiles is kept but should be computed from learned_words
-- Consider creating a view or function to calculate this dynamically in the future

-- Optional: Create a view to compute words_mastered dynamically
CREATE OR REPLACE VIEW user_word_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE mastery_level >= 3) as words_mastered,
  COUNT(*) FILTER (WHERE mastery_level >= 2) as words_known,
  COUNT(*) FILTER (WHERE mastery_level >= 1) as words_familiar,
  COUNT(*) as total_words_learned,
  MAX(last_reviewed_at) as last_review_date
FROM learned_words
GROUP BY user_id;
