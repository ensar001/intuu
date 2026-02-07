-- Create function to increment words mastered safely
CREATE OR REPLACE FUNCTION increment_words_mastered(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET words_mastered = words_mastered + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
