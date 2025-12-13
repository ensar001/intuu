-- Add new columns to profiles table for tracking user progress
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS words_mastered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_goal_type TEXT DEFAULT 'words', -- 'words' or 'analyzer_uses'
ADD COLUMN IF NOT EXISTS weekly_goal_target INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS weekly_goal_current INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_goal_reset_date DATE DEFAULT CURRENT_DATE;

-- Create user_activities table to track daily activities
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  words_learned INTEGER DEFAULT 0,
  analyzer_uses INTEGER DEFAULT 0,
  tutor_interactions INTEGER DEFAULT 0,
  flashcard_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Create learned_words table to track individual word mastery
CREATE TABLE IF NOT EXISTS learned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 1, -- 1: familiar, 2: known, 3: mastered
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- Add mastery tracking to cards table
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS times_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_incorrect INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mastery_level INTEGER DEFAULT 0; -- 0: new, 1: learning, 2: familiar, 3: mastered

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_date ON user_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_learned_words_user ON learned_words(user_id, learned_at DESC);
CREATE INDEX IF NOT EXISTS idx_learned_words_language ON learned_words(user_id, language);
CREATE INDEX IF NOT EXISTS idx_cards_mastery ON cards(deck_id, mastery_level, next_review_at);

-- Enable RLS on new tables
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_words ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activities
CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON user_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for learned_words
CREATE POLICY "Users can view own learned words"
  ON learned_words FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learned words"
  ON learned_words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learned words"
  ON learned_words FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own learned words"
  ON learned_words FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update streak and weekly goals
CREATE OR REPLACE FUNCTION update_user_streak_and_goals()
RETURNS TRIGGER AS $$
DECLARE
  profile_record RECORD;
  days_since_last_study INTEGER;
BEGIN
  -- Get current profile data
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE id = NEW.user_id;

  -- Calculate days since last study
  IF profile_record.last_study_date IS NULL THEN
    days_since_last_study := 0;
  ELSE
    days_since_last_study := NEW.activity_date - profile_record.last_study_date;
  END IF;

  -- Update streak logic
  IF days_since_last_study = 0 THEN
    -- Same day, don't change streak
    NULL;
  ELSIF days_since_last_study = 1 THEN
    -- Consecutive day, increment streak
    UPDATE profiles 
    SET current_streak = current_streak + 1,
        last_study_date = NEW.activity_date
    WHERE id = NEW.user_id;
  ELSIF days_since_last_study = 2 THEN
    -- Missed one day, keep streak
    UPDATE profiles 
    SET last_study_date = NEW.activity_date
    WHERE id = NEW.user_id;
  ELSE
    -- Missed 3+ days, reset streak
    UPDATE profiles 
    SET current_streak = 1,
        last_study_date = NEW.activity_date
    WHERE id = NEW.user_id;
  END IF;

  -- Reset weekly goal if needed (Monday)
  IF EXTRACT(DOW FROM NEW.activity_date) = 1 AND 
     NEW.activity_date > profile_record.weekly_goal_reset_date THEN
    UPDATE profiles
    SET weekly_goal_current = 0,
        weekly_goal_reset_date = NEW.activity_date
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for streak and goal updates
DROP TRIGGER IF EXISTS trigger_update_streak_goals ON user_activities;
CREATE TRIGGER trigger_update_streak_goals
  AFTER INSERT OR UPDATE ON user_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak_and_goals();
