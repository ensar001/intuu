-- Fix streak calculation logic to properly handle first-time users and daily activity tracking
-- This fixes the issue where streaks never increment due to UPDATE operations not changing activity_date

DROP TRIGGER IF EXISTS trigger_update_streak_goals ON user_activities;
DROP FUNCTION IF EXISTS update_user_streak_and_goals();

-- Improved function to handle streak updates correctly
CREATE OR REPLACE FUNCTION update_user_streak_and_goals()
RETURNS TRIGGER AS $$
DECLARE
  profile_record RECORD;
  days_since_last_study INTEGER;
  is_first_activity_today BOOLEAN;
BEGIN
  -- Get current profile data
  SELECT * INTO profile_record 
  FROM profiles 
  WHERE id = NEW.user_id;

  -- Check if this is the first activity today (INSERT or activity_date changed)
  -- This prevents multiple activities on the same day from repeatedly incrementing streak
  is_first_activity_today := (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.activity_date != NEW.activity_date));
  
  IF NOT is_first_activity_today THEN
    -- Same-day activity update, don't modify streak
    RETURN NEW;
  END IF;

  -- Handle streak calculation
  IF profile_record.last_study_date IS NULL THEN
    -- First ever activity: initialize streak to 1
    UPDATE profiles 
    SET current_streak = 1,
        last_study_date = NEW.activity_date
    WHERE id = NEW.user_id;
  ELSE
    -- Calculate days since last study
    days_since_last_study := NEW.activity_date - profile_record.last_study_date;
    
    IF days_since_last_study = 0 THEN
      -- Same day (should not happen due to is_first_activity_today check, but handle anyway)
      NULL;
    ELSIF days_since_last_study = 1 THEN
      -- Consecutive day, increment streak
      UPDATE profiles 
      SET current_streak = current_streak + 1,
          last_study_date = NEW.activity_date
      WHERE id = NEW.user_id;
    ELSIF days_since_last_study = 2 THEN
      -- Missed one day, keep streak (grace period)
      UPDATE profiles 
      SET last_study_date = NEW.activity_date
      WHERE id = NEW.user_id;
    ELSE
      -- Missed 3+ days, reset streak to 1
      UPDATE profiles 
      SET current_streak = 1,
          last_study_date = NEW.activity_date
      WHERE id = NEW.user_id;
    END IF;
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

-- Recreate trigger
CREATE TRIGGER trigger_update_streak_goals
  AFTER INSERT OR UPDATE ON user_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak_and_goals();

-- Fix any existing users with streak = 0 who have activity data
-- Set streak to 1 for users who have activities but no streak
UPDATE profiles
SET current_streak = 1
WHERE current_streak = 0 
  AND id IN (SELECT DISTINCT user_id FROM user_activities)
  AND last_study_date IS NOT NULL;
