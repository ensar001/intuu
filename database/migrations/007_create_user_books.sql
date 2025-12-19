-- Create user_books table to store uploaded e-books
CREATE TABLE IF NOT EXISTS user_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  language VARCHAR(10) NOT NULL DEFAULT 'de',
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('epub', 'pdf', 'txt')),
  content TEXT NOT NULL, -- Parsed text content
  total_pages INTEGER DEFAULT 1,
  current_page INTEGER DEFAULT 1,
  reading_progress INTEGER DEFAULT 0, -- Percentage 0-100
  bookmarks JSONB DEFAULT '[]'::jsonb, -- Array of bookmark positions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

-- Users can only see their own books
CREATE POLICY "Users can view own books"
  ON user_books FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own books
CREATE POLICY "Users can insert own books"
  ON user_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own books
CREATE POLICY "Users can update own books"
  ON user_books FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own books
CREATE POLICY "Users can delete own books"
  ON user_books FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_created_at ON user_books(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_user_books_updated_at
  BEFORE UPDATE ON user_books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
