-- Add completion tracking to user_books table
ALTER TABLE user_books 
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index for finding completed books
CREATE INDEX IF NOT EXISTS idx_user_books_completed ON user_books(user_id, completed, completed_at DESC);
