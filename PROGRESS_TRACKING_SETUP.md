# User Progress Tracking Implementation - Setup Instructions

## Overview
I've implemented a comprehensive user progress tracking system with the following features:

### Features Implemented:

#### 1. **Daily Streak Tracking**
- Tracks consecutive days of learning activity
- Shows streak count on dashboard with fire emoji 🔥
- Automatically resets if user misses 3+ days
- Allows missing 1-2 days without resetting streak

#### 2. **Weekly Goals**
- Users can set weekly goals for:
  - Words learned (flashcards mastered)
  - Text analyzer uses
- Configure goals in Settings page
- Real-time progress tracking with percentage display
- Automatically resets every Monday

#### 3. **Words Mastered Counter**
- Tracks total words user has mastered
- Updates when user marks flashcards as "I know this"
- Displayed on dashboard
- Used to calculate learning level

#### 4. **Learning Level Progression**
- A1 Beginner: 0-999 words
- A2 Elementary: 1000-1999 words
- B1 Intermediate: 2000-2999 words
- B2 Upper Intermediate: 3000-3999 words
- C1 Advanced: 4000-4999 words
- C1+ Advanced: 5000+ words

#### 5. **Spaced Repetition Review**
- "Review" button on deck selector
- Cards sorted by mastery level:
  1. Don't know (mastery 0) - shown first
  2. Learning (mastery 1)
  3. Familiar (mastery 2)
  4. Known/Mastered (mastery 3) - shown last
- Uses SM-2 spaced repetition algorithm
- Calculates optimal review intervals

#### 6. **Recent Vocabulary Display**
- Shows 5 most recently learned words on dashboard
- Displays mastery level for each word
- Click to navigate to flashcards
- Filtered by current learning language

## Database Setup

### Step 1: Run Migration Scripts

You need to run these SQL scripts in your Supabase SQL Editor:

1. **Main Migration** (`migrations/add-user-progress-tracking.sql`):
```sql
-- This creates:
-- - New columns in profiles table
-- - user_activities table for daily tracking
-- - learned_words table for vocabulary tracking
-- - Indexes and RLS policies
-- - Trigger function for automatic streak updates
```

2. **Increment Function** (`migrations/add-increment-function.sql`):
```sql
-- Creates secure function to increment words_mastered counter
```

### Step 2: Run Migrations in Supabase

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/add-user-progress-tracking.sql`
4. Click "Run"
5. Then copy and paste `migrations/add-increment-function.sql`
6. Click "Run"

## How It Works

### Activity Tracking

1. **Flashcards**: When user clicks "I know this":
   - Records flashcard review
   - Updates card mastery level (0-3)
   - Tracks word as learned
   - Updates words_mastered count
   - Updates weekly goal progress
   - Records daily activity
   - Updates streak automatically

2. **Text Analyzer**: When user analyzes text:
   - Records analyzer use
   - Updates weekly goal progress (if goal type is analyzer_uses)
   - Records daily activity
   - Updates streak automatically

3. **Language Tutor**: When user sends a message:
   - Records tutor interaction
   - Records daily activity
   - Updates streak automatically

### Automatic Streak Logic

The streak updates automatically through a database trigger:
- **Same day**: No change to streak
- **1 day gap**: Streak increases by 1
- **2 day gap**: Streak stays same (grace period)
- **3+ day gap**: Streak resets to 1

### Weekly Goals

Users can configure in Settings:
- Choose between "Words Learned" or "Text Analyses"
- Set target (10-200 words or 5-50 analyses)
- Progress bar shows current/target
- Resets every Monday automatically

## Testing the Features

### Test 1: Daily Streak
1. Open the app and perform any activity (flashcard review, text analysis, or tutor chat)
2. Check dashboard - should show "You're on a 1-day streak! 🔥"
3. Come back tomorrow and do another activity
4. Streak should increment to 2

### Test 2: Words Mastered
1. Go to Flashcards
2. Select a deck
3. Click "I know this" on a card
4. Check dashboard - Words Mastered count should increase
5. Learning Level should update based on total words

### Test 3: Weekly Goals
1. Go to Settings
2. Under "Weekly Goals" section
3. Choose goal type (Words or Analyses)
4. Set target with slider
5. Click "Save Goal Settings"
6. Perform relevant activities
7. Check dashboard - percentage should update

### Test 4: Spaced Repetition Review
1. Go to Flashcards
2. Instead of clicking on a deck, click the "Review" button
3. Cards will appear in order:
   - Unknown cards first
   - Learning cards second
   - Known cards last
4. Mark cards as correct/incorrect
5. Cards will be rescheduled based on SM-2 algorithm

### Test 5: Recent Vocabulary
1. Learn some words using flashcards
2. Go to Dashboard
3. Recent Vocabulary section should show last 5 learned words
4. Each word shows mastery level indicator
5. Click on a word to go to flashcards

## Files Modified/Created

### New Files:
- `src/utils/userStatsApi.js` - API functions for user stats
- `src/hooks/useUserStats.js` - React hook for stats management
- `migrations/add-user-progress-tracking.sql` - Main database migration
- `migrations/add-increment-function.sql` - Helper function migration

### Modified Files:
- `src/components/features/Dashboard.jsx` - Added real-time stats display
- `src/components/features/Flashcards.jsx` - Added progress tracking and review mode
- `src/components/features/DeckSelector.jsx` - Added Review button
- `src/components/features/TextAnalyzer.jsx` - Added activity tracking
- `src/components/features/GermanTutor.jsx` - Added activity tracking
- `src/components/features/Settings.jsx` - Added weekly goals configuration

## Next Steps

1. **Run the database migrations** (most important!)
2. Test all features
3. Monitor the console for any errors
4. Check Supabase logs if something doesn't work

## Troubleshooting

### Issue: Streak not updating
- Check if `user_activities` table exists
- Verify trigger is installed: `trigger_update_streak_goals`
- Check Supabase logs for errors

### Issue: Words mastered not increasing
- Verify `learned_words` table exists
- Check if `increment_words_mastered` function is created
- Ensure RLS policies are enabled

### Issue: Weekly goal not resetting
- Check `weekly_goal_reset_date` in profiles table
- Trigger should reset on Monday (DOW = 1)

### Issue: Review mode not working
- Verify `mastery_level` column exists in `cards` table
- Check cards have mastery data
- Look for JavaScript errors in console

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify all migrations ran successfully
4. Ensure RLS policies are enabled for new tables
