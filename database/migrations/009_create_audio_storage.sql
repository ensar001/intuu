-- Migration: Create Supabase Storage for TTS Audio Caching
-- Date: 2025-12-20
-- Description: Creates storage bucket for cached audio files to reduce Polly API costs

-- ============================================================================
-- PART 1: CREATE STORAGE BUCKET
-- ============================================================================

-- Create public storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-audio', 'ebook-audio', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2: STORAGE POLICIES (RLS)
-- ============================================================================

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ebook-audio');

-- Allow public read access to audio files (for CDN delivery)
-- This enables anyone to play cached audio without authentication
CREATE POLICY "Anyone can download audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ebook-audio');

-- Allow authenticated users to delete cached audio
-- Useful for clearing old cache or user-specific cleanup
CREATE POLICY "Authenticated users can delete audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ebook-audio');

-- ============================================================================
-- PART 3: OPTIONAL CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up old audio files (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_audio_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Note: This requires storage admin privileges
  -- Delete files older than 30 days
  DELETE FROM storage.objects
  WHERE bucket_id = 'ebook-audio'
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================

-- Verify bucket was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'ebook-audio') THEN
    RAISE NOTICE 'Storage bucket "ebook-audio" created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create storage bucket "ebook-audio"';
  END IF;
END $$;

-- Show bucket configuration
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'ebook-audio';

-- Show created policies
SELECT 
  policyname,
  tablename,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%audio%';

COMMENT ON FUNCTION cleanup_old_audio_cache() IS 
  'Removes cached audio files older than 30 days to free up storage space';
