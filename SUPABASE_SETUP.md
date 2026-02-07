# Supabase Setup Guide

## Prerequisites
- Node.js installed
- npm or yarn installed
- A Supabase account (free tier available at https://supabase.com)

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in (or create an account)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: intuu (or any name you prefer)
   - **Database Password**: Choose a strong password and save it securely
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for provisioning (~2 minutes)

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key**: Copy this (long string starting with `eyJ...`)

## Step 3: Configure Environment Variables

1. Open the `.env` file in the root of your project
2. Update the Supabase values:

```env
VITE_GEMINI_API_KEY=
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace the placeholders with your actual values from Step 2.

## Step 4: Set Up Database Tables

1. In your Supabase project dashboard, go to **SQL Editor** (in the sidebar)
2. Click on **New query**
3. Copy the entire contents of `supabase-setup.sql` file from this project
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned" - this means your tables were created successfully

### What this creates:
- `profiles` table: User profiles with XP points, streaks, and study dates
- `decks` table: Flashcard decks (can be private or public)
- `cards` table: Individual flashcards with spaced repetition data
- Row Level Security (RLS) policies: Users can only access their own data
- Indexes: For better query performance
- Triggers: Auto-update timestamps

## Step 5: Verify Database Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see three tables: `profiles`, `decks`, and `cards`
3. Click on each table to verify the columns match the schema

## Step 6: Install Dependencies

Run this command in your project directory:

```bash
npm install
```

This will install all required packages including `@supabase/supabase-js`.

## Step 7: Start the Development Server

```bash
npm run dev
```

Your app should now be running at http://localhost:5173

## Step 8: Test Authentication

1. Visit http://localhost:5173
2. You should be automatically redirected to the login page
3. Click "Sign up" to create a new account
4. Fill in:
   - Username (at least 3 characters)
   - Email address
   - Password (at least 6 characters)
   - Confirm password
5. Click "Sign Up"
6. You should be redirected to the dashboard

## Troubleshooting

### "Invalid API Key" or "Failed to fetch"
- Double-check your `.env` file has the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing `.env` (Ctrl+C, then `npm run dev` again)

### "Database error" when signing up
- Verify the SQL script ran successfully (Step 4)
- Check the Supabase dashboard **Table Editor** to confirm tables exist
- Go to **Authentication** > **Policies** to verify RLS policies are enabled

### Can't access dashboard after login
- Open browser console (F12) and check for errors
- Verify authentication status in Supabase dashboard: **Authentication** > **Users**
- Make sure the profile was created in the `profiles` table

### Email confirmation required
By default, Supabase requires email confirmation. To disable during development:
1. Go to **Authentication** > **Settings**
2. Scroll to **Email Auth**
3. Toggle off "Enable email confirmations"

### Enable compromised password protection
Supabase can block known-compromised passwords using HaveIBeenPwned.org:
1. Go to **Authentication** > **Settings**
2. Find **Security** (or **Password Protection**)
3. Enable **Check passwords against HaveIBeenPwned**

## Database Schema Reference

### profiles
- `id`: UUID (references auth.users)
- `username`: Unique username
- `xp_points`: Experience points earned
- `current_streak`: Days of consecutive study
- `last_study_date`: Last time user studied
- `created_at`, `updated_at`: Timestamps

### decks
- `id`: UUID
- `user_id`: References profiles.id
- `title`: Deck name
- `is_public`: Whether deck is visible to others
- `created_at`, `updated_at`: Timestamps

### cards
- `id`: UUID
- `deck_id`: References decks.id
- `front_text`: Question/term
- `back_text`: Answer/definition
- `audio_url`: Optional audio pronunciation
- `next_review_at`: When to show card next (spaced repetition)
- `interval`: Days until next review
- `ease_factor`: SM-2 algorithm difficulty factor
- `created_at`, `updated_at`: Timestamps

## Spaced Repetition System

The app uses the **SM-2 algorithm** for optimal flashcard review scheduling:
- Cards are shown at increasing intervals based on how well you know them
- Quality ratings affect future intervals:
  - 0-1: Forgot → Reset interval to 1 day
  - 2: Hard → Interval × 1.2
  - 3: Good → Interval × ease_factor
  - 4-5: Easy → Interval × ease_factor × 1.3
- `ease_factor` adjusts based on your performance history

## Security Notes

- **Never commit your `.env` file to Git** - it's already in `.gitignore`
- The `anon` key is safe to use in client-side code (Supabase RLS protects your data)
- Row Level Security ensures users can only access their own data
- Public decks are readable by all users but only editable by owners

## Next Steps

- Migrate existing flashcards from JSON files to Supabase decks
- Add profile editing functionality
- Implement XP and streak tracking
- Create public deck browsing feature
- Add audio recording for card pronunciation

## Support

If you encounter issues:
1. Check Supabase dashboard **Logs** for error details
2. Review browser console for client-side errors
3. Verify RLS policies in **Authentication** > **Policies**
4. Test SQL queries in **SQL Editor** to debug database issues
