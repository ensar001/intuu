-- Migration: Simplify Schema - Remove Spaced Repetition & Shared Decks
-- Date: 2025-12-20
-- Description: Remove SM-2 algorithm fields, shared deck support, optimize for performance

-- ============================================================================
-- PART 1: SIMPLIFY CARDS TABLE (Remove Spaced Repetition Fields)
-- ============================================================================

-- Drop indexes related to spaced repetition
DROP INDEX IF EXISTS idx_cards_next_review;
DROP INDEX IF EXISTS idx_cards_mastery;

-- Remove spaced repetition fields from cards table
ALTER TABLE cards 
  DROP COLUMN IF EXISTS interval CASCADE,
  DROP COLUMN IF EXISTS ease_factor CASCADE,
  DROP COLUMN IF EXISTS next_review_at CASCADE;

-- Keep only simple progress tracking: mastery_level (0-3), times_correct, times_incorrect
-- These are lightweight counters that don't prevent deck sharing if needed later

-- Add basic index for filtering by mastery level
CREATE INDEX IF NOT EXISTS idx_cards_deck_mastery ON cards(deck_id, mastery_level);

-- ============================================================================
-- PART 2: REMOVE SHARED DECK FEATURE FROM DECKS TABLE
-- ============================================================================

-- Remove is_public field (not in schema but may exist in some environments)
ALTER TABLE decks 
  DROP COLUMN IF EXISTS is_public CASCADE;

-- Add language field (required but missing from schema)
ALTER TABLE decks 
  ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'de';

-- Add constraint to enforce ISO language codes
ALTER TABLE decks
  DROP CONSTRAINT IF EXISTS decks_language_check;
ALTER TABLE decks 
  ADD CONSTRAINT decks_language_check 
  CHECK (language IN ('de', 'en', 'tr', 'fr', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'));

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_decks_user_language ON decks(user_id, language);

-- ============================================================================
-- PART 3: SIMPLIFY LEARNED_WORDS TABLE
-- ============================================================================

-- Remove card_id foreign key to decouple vocabulary from specific cards
-- This makes learned_words a pure vocabulary dictionary
ALTER TABLE learned_words 
  DROP CONSTRAINT IF EXISTS learned_words_card_id_fkey CASCADE;

ALTER TABLE learned_words 
  DROP COLUMN IF EXISTS card_id CASCADE;

-- Update unique constraint to be based on word text, not card_id
ALTER TABLE learned_words
  DROP CONSTRAINT IF EXISTS learned_words_user_id_card_id_key CASCADE;

-- Add unique constraint on user_id + word + language
ALTER TABLE learned_words
  DROP CONSTRAINT IF EXISTS learned_words_user_word_unique;
ALTER TABLE learned_words
  ADD CONSTRAINT learned_words_user_word_unique 
  UNIQUE(user_id, word, language);

-- Enforce language data type consistency
ALTER TABLE learned_words 
  ALTER COLUMN language TYPE VARCHAR(5);

ALTER TABLE learned_words
  DROP CONSTRAINT IF EXISTS learned_words_language_check;
ALTER TABLE learned_words 
  ADD CONSTRAINT learned_words_language_check 
  CHECK (language IN ('de', 'en', 'tr', 'fr', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'));

-- Optimize index for word lookups
DROP INDEX IF EXISTS idx_learned_words_language;
CREATE INDEX IF NOT EXISTS idx_learned_words_user_lang_mastery 
  ON learned_words(user_id, language, mastery_level);

-- ============================================================================
-- PART 4: OPTIMIZE USER_BOOKS TABLE (Prepare for Content Offloading)
-- ============================================================================

-- Add content_url column for external storage (S3/Supabase Storage)
ALTER TABLE user_books 
  ADD COLUMN IF NOT EXISTS content_url TEXT;

-- Make content nullable for migration path
ALTER TABLE user_books 
  ALTER COLUMN content DROP NOT NULL;

-- Add check constraint: must have either content OR content_url
ALTER TABLE user_books
  DROP CONSTRAINT IF EXISTS user_books_content_check;
ALTER TABLE user_books
  ADD CONSTRAINT user_books_content_check 
  CHECK (
    (content IS NOT NULL AND content_url IS NULL) OR
    (content IS NULL AND content_url IS NOT NULL)
  );

-- Enforce language data type consistency
ALTER TABLE user_books 
  ALTER COLUMN language TYPE VARCHAR(5);

ALTER TABLE user_books
  DROP CONSTRAINT IF EXISTS user_books_language_check;
ALTER TABLE user_books 
  ADD CONSTRAINT user_books_language_check 
  CHECK (language IN ('de', 'en', 'tr', 'fr', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'));

-- Add index for language filtering
CREATE INDEX IF NOT EXISTS idx_user_books_user_language 
  ON user_books(user_id, language);

-- ============================================================================
-- PART 5: VERIFY USER_ACTIVITIES CONSTRAINTS
-- ============================================================================

-- Ensure unique constraint exists (prevent duplicate daily entries)
ALTER TABLE user_activities
  DROP CONSTRAINT IF EXISTS user_activities_user_date_unique;
ALTER TABLE user_activities
  ADD CONSTRAINT user_activities_user_date_unique 
  UNIQUE(user_id, activity_date);

-- ============================================================================
-- PART 6: OPTIMIZE PROFILES TABLE (Fix Denormalization)
-- ============================================================================

-- Add computed column comment for documentation
COMMENT ON COLUMN profiles.words_mastered IS 
  'Denormalized counter - updated by increment_words_mastered() function when word reaches mastery_level 3';

COMMENT ON COLUMN profiles.xp_points IS 
  'Reserved for future gamification - not currently used';

-- ============================================================================
-- PART 7: UPDATE RLS POLICIES (Simplify by Removing Public Deck Logic)
-- ============================================================================

-- Drop old policies that reference is_public
DROP POLICY IF EXISTS "Users can view their own decks and public decks" ON decks;
DROP POLICY IF EXISTS "Users can view cards from their own decks or public decks" ON cards;

-- Recreate simplified policies (users can only see their own decks)
CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view cards from their own decks"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

-- Keep other policies unchanged (INSERT/UPDATE/DELETE already user-scoped)

-- ============================================================================
-- PART 8: VERIFY FOREIGN KEY TARGETS
-- ============================================================================

-- Check that all user_id foreign keys point to auth.users.id
-- user_books already references auth.users (correct)
-- profiles references auth.users (correct)
-- Other tables reference profiles.id (acceptable since profiles.id = auth.users.id)

-- Add comment for clarity
COMMENT ON COLUMN decks.user_id IS 
  'References profiles.id which is 1:1 with auth.users.id';

COMMENT ON COLUMN cards.deck_id IS 
  'References decks.id - cascade delete when deck is removed';

COMMENT ON COLUMN learned_words.user_id IS 
  'References profiles.id - vocabulary dictionary independent of cards';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Run ANALYZE to update query planner statistics
ANALYZE cards;
ANALYZE decks;
ANALYZE learned_words;
ANALYZE user_books;
ANALYZE user_activities;
ANALYZE profiles;
