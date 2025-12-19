# API Reference Documentation

## Table of Contents
1. [Overview](#overview)
2. [Frontend API Utilities](#frontend-api-utilities)
3. [Backend Routes](#backend-routes)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Overview

Intuu's API architecture follows a clear separation between:
- **Frontend API Utilities** - Client-side functions that interact with Supabase or backend
- **Backend Routes** - Express.js endpoints for AI services (Gemini, DeepL)
- **Database Layer** - PostgreSQL with Row-Level Security (RLS)

### API Architecture Diagram

```
Frontend Component
    ↓
Frontend API Utility (utils/*.js)
    ↓
├─→ Direct to Supabase (via supabase-js)
│   └─→ PostgreSQL with RLS
│
└─→ Backend API Route (via fetch)
    ├─→ Express Middleware (auth)
    └─→ External API (Gemini AI, DeepL)
```

### Base URLs

```javascript
// Frontend Environment Variables
VITE_SUPABASE_URL=https://ruxjfzmzyahfejyumtli.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

// Backend Environment Variables
PORT=3001
SUPABASE_URL=https://ruxjfzmzyahfejyumtli.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
DEEPL_API_KEY=c0246dc2-fcba...
```

---

## Frontend API Utilities

### supabaseClient.js

**Location**: supabaseClient.js

#### Supabase Client Configuration

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton pattern for HMR stability
if (!window.__supabase) {
  window.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-auth-token'
    }
  });
}

export const supabase = window.__supabase;
```

**Why Singleton Pattern?**
- Vite's HMR causes module reloads during development
- Multiple Supabase instances create race conditions
- `window.__supabase` ensures single instance across reloads

#### Authentication Helpers

```javascript
export const authHelpers = {
  // Sign up new user
  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    
    if (error) throw error;
    
    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          xp_points: 0,
          current_streak: 0,
          last_study_date: new Date().toISOString().split('T')[0]
        });
      
      if (profileError) throw profileError;
    }
    
    return data;
  },
  
  // Sign in existing user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },
  
  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
  
  // Update user password
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  }
};
```

**Usage Example**:
```javascript
import { authHelpers } from './utils/supabaseClient';

// Sign up
await authHelpers.signUp('user@example.com', 'SecurePass123!', 'johndoe');

// Sign in
await authHelpers.signIn('user@example.com', 'SecurePass123!');

// Sign out
await authHelpers.signOut();
```

---

### deckApi.js

**Location**: deckApi.js

#### Deck Management

```javascript
/**
 * Get all decks for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of deck objects
 */
export const getDecks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select(`
        *,
        cards:cards(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Add card count to each deck
    return data.map(deck => ({
      ...deck,
      card_count: deck.cards[0]?.count || 0
    }));
  } catch (error) {
    console.error('Error fetching decks:', error);
    throw error;
  }
};

/**
 * Create a new deck
 * @param {Object} deckData - Deck properties
 * @returns {Promise<Object>} Created deck
 */
export const createDeck = async (deckData) => {
  try {
    const { data, error } = await supabase
      .from('decks')
      .insert({
        user_id: deckData.user_id,
        title: deckData.title,
        description: deckData.description || null,
        language: deckData.language || 'de',
        is_public: deckData.is_public || false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating deck:', error);
    throw error;
  }
};

/**
 * Update deck properties
 * @param {string} deckId - Deck UUID
 * @param {Object} updates - Properties to update
 * @returns {Promise<Object>} Updated deck
 */
export const updateDeck = async (deckId, updates) => {
  try {
    const { data, error } = await supabase
      .from('decks')
      .update(updates)
      .eq('id', deckId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating deck:', error);
    throw error;
  }
};

/**
 * Delete a deck and all its cards (CASCADE)
 * @param {string} deckId - Deck UUID
 * @returns {Promise<boolean>} Success status
 */
export const deleteDeck = async (deckId) => {
  try {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
};
```

#### Card Management

```javascript
/**
 * Get all cards in a deck
 * @param {string} deckId - Deck UUID
 * @returns {Promise<Array>} Array of card objects
 */
export const getCards = async (deckId) => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('next_review_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
};

/**
 * Get due cards (next_review_at <= now)
 * @param {string} deckId - Deck UUID
 * @returns {Promise<Array>} Array of due cards
 */
export const getDueCards = async (deckId) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching due cards:', error);
    throw error;
  }
};

/**
 * Create a new flashcard
 * @param {Object} cardData - Card properties
 * @returns {Promise<Object>} Created card
 */
export const createCard = async (cardData) => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .insert({
        deck_id: cardData.deck_id,
        front_text: cardData.front_text,
        back_text: cardData.back_text,
        category: cardData.category || null,
        usage_example: cardData.usage_example || null,
        mastery_level: 0,
        interval: 0,
        ease_factor: 2.5,
        times_correct: 0,
        times_incorrect: 0,
        next_review_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
};

/**
 * Update card after review (SM-2 algorithm)
 * @param {string} cardId - Card UUID
 * @param {number} quality - Quality rating (0-5)
 * @param {boolean} isCorrect - Answer correctness
 * @returns {Promise<Object>} Updated card
 */
export const updateCard = async (cardId, quality, isCorrect) => {
  try {
    // Get current card
    const { data: card, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Calculate SM-2 values
    const sm2Result = calculateNextReview(
      quality,
      card.interval,
      card.ease_factor,
      card.times_correct
    );
    
    // Update mastery level
    let newMasteryLevel = card.mastery_level;
    if (isCorrect) {
      newMasteryLevel = Math.min(3, newMasteryLevel + 1);
    } else {
      newMasteryLevel = Math.max(0, newMasteryLevel - 1);
    }
    
    // Update card
    const { data, error } = await supabase
      .from('cards')
      .update({
        mastery_level: newMasteryLevel,
        interval: sm2Result.interval,
        ease_factor: sm2Result.easeFactor,
        next_review_at: sm2Result.nextReviewAt,
        times_correct: isCorrect ? card.times_correct + 1 : card.times_correct,
        times_incorrect: !isCorrect ? card.times_incorrect + 1 : card.times_incorrect,
        last_reviewed_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating card:', error);
    throw error;
  }
};

/**
 * Delete a card
 * @param {string} cardId - Card UUID
 * @returns {Promise<boolean>} Success status
 */
export const deleteCard = async (cardId) => {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
};
```

#### SM-2 Algorithm Implementation

```javascript
/**
 * SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 * @param {number} quality - Quality of recall (0-5)
 * @param {number} currentInterval - Current interval in days
 * @param {number} currentEaseFactor - Current ease factor
 * @param {number} timesCorrect - Total correct answers
 * @returns {Object} { interval, easeFactor, nextReviewAt }
 */
export const calculateNextReview = (
  quality,
  currentInterval = 0,
  currentEaseFactor = 2.5,
  timesCorrect = 0
) => {
  // Calculate new ease factor
  let newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Min ease factor = 1.3
  
  // Calculate new interval
  let newInterval;
  
  if (quality < 3) {
    // Incorrect answer - reset to 1 day
    newInterval = 1;
  } else {
    // Correct answer - increase interval
    if (timesCorrect === 0) {
      newInterval = 1; // First review: 1 day
    } else if (timesCorrect === 1) {
      newInterval = 6; // Second review: 6 days
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
  }
  
  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);
  
  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReviewAt: nextReviewAt.toISOString()
  };
};
```

**SM-2 Algorithm Explanation:**

| Quality | Meaning | Interval Change |
|---------|---------|-----------------|
| 5 | Perfect recall | Max increase (×ease_factor) |
| 4 | Correct after hesitation | Good increase |
| 3 | Correct with difficulty | Moderate increase |
| 2 | Incorrect but recognized | Reset to 1 day |
| 1 | Incorrect, vague memory | Reset to 1 day |
| 0 | Total blackout | Reset to 1 day |

**Interval Progression Example:**
```
First correct (quality 5): 1 day
Second correct: 6 days
Third correct: 6 * 2.5 = 15 days
Fourth correct: 15 * 2.6 = 39 days
Fifth correct: 39 * 2.7 = 105 days
```

---

### userStatsApi.js

**Location**: userStatsApi.js

#### User Profile

```javascript
/**
 * Get user profile with all statistics
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Profile object
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User UUID
 * @param {Object} updates - Profile properties to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
```

#### Activity Recording

```javascript
/**
 * Record user activity (updates streak automatically via trigger)
 * @param {string} userId - User UUID
 * @param {string} activityType - Activity type
 * @param {number} count - Activity count
 * @returns {Promise<Object>} Activity record
 */
export const recordActivity = async (userId, activityType, count = 1) => {
  try {
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_count: count,
        activity_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording activity:', error);
    throw error;
  }
};
```

**Activity Types:**
- `flashcard_reviews` - Flashcard study session
- `words_learned` - Word mastered (mastery_level = 3)
- `text_analyses` - Text analyzer usage
- `tutor_sessions` - AI tutor conversation
- `reading_time` - E-book reading session

**Database Trigger (auto-updates streak):**
```sql
CREATE OR REPLACE FUNCTION update_streak_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  current_streak INT;
BEGIN
  -- Get current streak and last study date
  SELECT last_study_date, current_streak
  INTO last_date, current_streak
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Update streak logic
  IF last_date IS NULL THEN
    -- First activity ever
    current_streak := 1;
  ELSIF last_date = CURRENT_DATE THEN
    -- Already studied today, no change
    RETURN NEW;
  ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Studied yesterday, increment streak
    current_streak := current_streak + 1;
  ELSE
    -- Missed days, reset streak
    current_streak := 1;
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET 
    last_study_date = CURRENT_DATE,
    current_streak = current_streak
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON user_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_activity();
```

#### Word Learning

```javascript
/**
 * Mark a word as learned (with mastery level)
 * @param {string} userId - User UUID
 * @param {string} word - Word text
 * @param {string} language - Language code
 * @param {string} cardId - Optional flashcard ID
 * @param {number} masteryLevel - Mastery level (0-3)
 * @returns {Promise<Object>} Learned word record
 */
export const learnWord = async (userId, word, language, cardId = null, masteryLevel = 1) => {
  try {
    const { data, error } = await supabase
      .from('learned_words')
      .upsert({
        user_id: userId,
        word,
        language,
        card_id: cardId,
        mastery_level: masteryLevel
      }, {
        onConflict: 'user_id,word,language',
        // Update mastery to higher value if word already exists
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error learning word:', error);
    throw error;
  }
};

/**
 * Get recently learned words
 * @param {string} userId - User UUID
 * @param {number} limit - Number of words to fetch
 * @returns {Promise<Array>} Array of learned words
 */
export const getRecentWords = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('learned_words')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent words:', error);
    throw error;
  }
};
```

**UPSERT Logic (prevents duplicates):**
```sql
-- If word exists: Update mastery_level to MAXIMUM(old, new)
-- If word doesn't exist: Insert new record
INSERT INTO learned_words (user_id, word, language, mastery_level)
VALUES ('user-id', 'der Tisch', 'de', 2)
ON CONFLICT (user_id, word, language)
DO UPDATE SET
  mastery_level = GREATEST(learned_words.mastery_level, EXCLUDED.mastery_level),
  updated_at = NOW();
```

#### Weekly Goals

```javascript
/**
 * Update weekly goal progress
 * @param {string} userId - User UUID
 * @param {number} increment - Amount to add
 * @returns {Promise<Object>} Updated profile
 */
export const updateWeeklyGoal = async (userId, increment = 1) => {
  try {
    const { data, error } = await supabase
      .rpc('increment_weekly_goal', {
        user_uuid: userId,
        increment_by: increment
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating weekly goal:', error);
    throw error;
  }
};

/**
 * Set new weekly goal
 * @param {string} userId - User UUID
 * @param {string} goalType - 'words_learned' or 'text_analyses'
 * @param {number} target - Target count
 * @returns {Promise<Object>} Updated profile
 */
export const setWeeklyGoal = async (userId, goalType, target) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        weekly_goal_type: goalType,
        weekly_goal_target: target,
        weekly_goal_current: 0 // Reset progress
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error setting weekly goal:', error);
    throw error;
  }
};
```

**Database Function (atomic increment):**
```sql
CREATE OR REPLACE FUNCTION increment_weekly_goal(
  user_uuid UUID,
  increment_by INT
)
RETURNS profiles AS $$
DECLARE
  updated_profile profiles;
BEGIN
  UPDATE profiles
  SET weekly_goal_current = weekly_goal_current + increment_by
  WHERE id = user_uuid
  RETURNING * INTO updated_profile;
  
  RETURN updated_profile;
END;
$$ LANGUAGE plpgsql;
```

#### Learning Level Calculation

```javascript
/**
 * Calculate CEFR level based on words mastered
 * @param {number} wordCount - Words mastered count
 * @returns {Object} { level, label, nextLevel, wordsNeeded }
 */
export const calculateLearningLevel = (wordCount) => {
  const levels = [
    { level: 'A1', label: 'Beginner', threshold: 0, nextThreshold: 500 },
    { level: 'A2', label: 'Elementary', threshold: 500, nextThreshold: 1000 },
    { level: 'B1', label: 'Intermediate', threshold: 1000, nextThreshold: 2000 },
    { level: 'B2', label: 'Upper Intermediate', threshold: 2000, nextThreshold: 3000 },
    { level: 'C1', label: 'Advanced', threshold: 3000, nextThreshold: 5000 },
    { level: 'C2', label: 'Proficiency', threshold: 5000, nextThreshold: Infinity }
  ];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (wordCount >= levels[i].threshold) {
      return {
        level: levels[i].level,
        label: levels[i].label,
        nextLevel: levels[i + 1]?.level || 'C2',
        wordsNeeded: Math.max(0, levels[i].nextThreshold - wordCount)
      };
    }
  }
  
  return levels[0];
};
```

**CEFR Level Thresholds:**

| Level | Label | Words Required |
|-------|-------|----------------|
| A1 | Beginner | 0 - 499 |
| A2 | Elementary | 500 - 999 |
| B1 | Intermediate | 1000 - 1999 |
| B2 | Upper Intermediate | 2000 - 2999 |
| C1 | Advanced | 3000 - 4999 |
| C2 | Proficiency | 5000+ |

---

### ebookApi.js

**Location**: ebookApi.js

#### E-Book Management

```javascript
/**
 * Get all user's e-books
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of books
 */
export const getUserBooks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

/**
 * Get single book by ID
 * @param {string} bookId - Book UUID
 * @returns {Promise<Object>} Book object
 */
export const getBookById = async (bookId) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .select('*')
      .eq('id', bookId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching book:', error);
    throw error;
  }
};

/**
 * Update reading progress
 * @param {string} bookId - Book UUID
 * @param {number} currentPage - Current page number
 * @param {number} progressPercentage - Progress percentage
 * @returns {Promise<Object>} Updated book
 */
export const updateReadingProgress = async (bookId, currentPage, progressPercentage) => {
  try {
    const { data, error } = await supabase
      .from('user_books')
      .update({
        current_page: currentPage,
        progress_percentage: progressPercentage,
        last_read_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

/**
 * Delete a book
 * @param {string} bookId - Book UUID
 * @returns {Promise<boolean>} Success status
 */
export const deleteBook = async (bookId) => {
  try {
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('id', bookId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};
```

#### PDF Parsing

```javascript
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Parse PDF file and extract text
 * @param {File} file - PDF file object
 * @returns {Promise<string>} Extracted text content
 */
export const parsePdfFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items by Y position (lines)
      const lines = {};
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item);
      });
      
      // Sort lines top to bottom
      const sortedY = Object.keys(lines).sort((a, b) => b - a);
      
      let previousY = null;
      let previousFontSize = null;
      let isFirstLine = true;
      
      sortedY.forEach(y => {
        const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = lineItems.map(item => item.str).join(' ').trim();
        
        if (lineText) {
          const fontSize = lineItems[0].height || 12;
          const yGap = previousY ? previousY - y : 0;
          
          // First line = title (mark with ###)
          if (isFirstLine && lineText.length > 5) {
            fullText += '### ';
            isFirstLine = false;
          }
          // Paragraph breaks
          else if (yGap > fontSize * 1.5) {
            fullText += '\n\n';
          }
          // Detect headings (font size increase)
          else if (previousFontSize && fontSize > previousFontSize * 1.2) {
            fullText += '\n\n### ';
          }
          
          fullText += lineText + '\n';
          previousY = y;
          previousFontSize = fontSize;
        }
      });
      
      // Page break
      if (pageNum < pdf.numPages) {
        fullText += '\n\n---\n\n';
      }
    }
    
    // Clean up text
    fullText = fullText
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    return fullText;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
};

/**
 * Parse TXT file
 * @param {File} file - TXT file object
 * @returns {Promise<string>} File text content
 */
export const parseTxtFile = async (file) => {
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    console.error('TXT parsing error:', error);
    throw new Error('Failed to parse TXT file');
  }
};
```

#### Translation (DeepL API)

```javascript
/**
 * Translate text using DeepL API
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} { translation, detectedSourceLang }
 */
export const translateText = async (text, sourceLang, targetLang) => {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');
    
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Translation failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};
```

---

### geminiApi.js

**Location**: geminiApi.js

#### Rate Limiting

```javascript
// Rate limiting configuration
const MIN_CALL_INTERVAL = 1000; // 1 second between calls
let lastCallTime = 0;

/**
 * Enforce rate limiting
 * @returns {Promise<void>}
 */
const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    const waitTime = MIN_CALL_INTERVAL - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastCallTime = Date.now();
};
```

#### Authentication Helper

```javascript
/**
 * Get auth token from Supabase session
 * @returns {Promise<string>} JWT token
 */
const getAuthToken = async () => {
  const { supabase } = await import('./supabaseClient.js');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};
```

#### Backend AI Call

```javascript
/**
 * Call backend AI API (Gemini)
 * @param {string} endpoint - API endpoint
 * @param {Object} payload - Request payload
 * @returns {Promise<any>} API response
 */
const callBackendAI = async (endpoint, payload) => {
  await enforceRateLimit();
  
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required');
  
  const response = await fetch(`http://localhost:3001${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API call failed');
  }
  
  return await response.json();
};
```

#### Text Analysis

```javascript
/**
 * Analyze German text with Gemini AI
 * @param {string} text - German text to analyze
 * @param {string} level - CEFR level (optional)
 * @param {string} languageName - Language name
 * @param {string} interfaceLanguageName - Interface language
 * @param {boolean} shouldTranslate - Include translations
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeText = async (
  text,
  level = 'B1',
  languageName = 'German',
  interfaceLanguageName = 'English',
  shouldTranslate = false
) => {
  return await callBackendAI('/api/ai/analyze-text', {
    text,
    level,
    languageName,
    interfaceLanguageName,
    shouldTranslate
  });
};
```

#### Tutor Chat

```javascript
/**
 * Send message to AI tutor
 * @param {Array} conversationHistory - Message history
 * @returns {Promise<Object>} Tutor response
 */
export const tutorChat = async (conversationHistory) => {
  return await callBackendAI('/api/ai/tutor-chat', {
    messages: conversationHistory
  });
};
```

---

## Backend Routes

### ai.js

**Location**: ai.js

#### Text Analysis Endpoint

```javascript
router.post('/analyze-text', authenticateUser, async (req, res) => {
  try {
    const { text, level, languageName, interfaceLanguageName, shouldTranslate } = req.body;
    
    if (!text || !languageName || !interfaceLanguageName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const systemPrompt = `You are an expert ${languageName} language teacher specializing in ${level} proficiency level.
Analyze the provided ${languageName} text for ${level} level learners.
Provide ALL explanations in ${interfaceLanguageName}.

Return a JSON object with:
- sentences: Array of sentence analysis
- overallFeedback: Overall text assessment
- grammarPoints: Grammar concepts used
- vocabulary: Key words with translations
- suggestions: Learning tips`;

    const result = await callGemini(text, systemPrompt, /* responseSchema */ null);
    
    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});
```

#### Tutor Chat Endpoint

```javascript
router.post('/tutor-chat', authenticateUser, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    
    const systemInstruction = `You are a friendly German language tutor.
Help students practice German, explain grammar, and encourage learning.
Respond in German unless the student asks for English explanations.`;

    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      text: msg.content
    }));

    const response = await callGemini(
      messages[messages.length - 1].content,
      systemInstruction,
      null,
      conversationHistory
    );
    
    res.json({ message: response });
  } catch (error) {
    console.error('Tutor chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});
```

### ebooks.js

**Location**: ebooks.js

#### Translation Endpoint (DeepL)

```javascript
import * as deepl from 'deepl-node';

const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

router.post('/translate', authenticateUser, async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 chars)' });
    }
    
    // Map language codes to DeepL format
    const langMap = {
      'en': 'en-US',
      'de': 'de',
      'tr': 'tr'
    };
    
    const deeplSourceLang = sourceLang ? langMap[sourceLang] || sourceLang : null;
    const deeplTargetLang = langMap[targetLang] || targetLang;
    
    // Call DeepL API
    const result = await translator.translateText(
      text,
      deeplSourceLang,
      deeplTargetLang
    );
    
    res.json({
      translation: result.text,
      detectedSourceLang: result.detectedSourceLang
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
```

---

## Database Schema

### Core Tables

**profiles table:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  xp_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  words_mastered INTEGER DEFAULT 0,
  weekly_goal_type TEXT DEFAULT 'words_learned',
  weekly_goal_target INTEGER DEFAULT 50,
  weekly_goal_current INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
```

**decks table:**
```sql
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'de',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decks_user_id ON decks(user_id);
```

**cards table:**
```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  category TEXT,
  usage_example TEXT,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 3),
  interval INTEGER DEFAULT 0,
  ease_factor NUMERIC(3, 2) DEFAULT 2.5,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_next_review ON cards(next_review_at);
```

**learned_words table:**
```sql
CREATE TABLE learned_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  mastery_level INTEGER DEFAULT 1 CHECK (mastery_level BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word, language)
);

CREATE INDEX idx_learned_words_user_id ON learned_words(user_id);
```

**user_activities table:**
```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_count INTEGER DEFAULT 1,
  activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_date ON user_activities(activity_date);
```

**user_books table:**
```sql
CREATE TABLE user_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  total_pages INTEGER DEFAULT 1,
  current_page INTEGER DEFAULT 1,
  progress_percentage NUMERIC(5, 2) DEFAULT 0,
  bookmarks JSONB DEFAULT '[]'::jsonb,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_books_user_id ON user_books(user_id);
```

### Row-Level Security (RLS) Policies

**profiles table:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**decks table:**
```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Users can view their own decks OR public decks
CREATE POLICY "Users can view own or public decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

-- Users can only manage their own decks
CREATE POLICY "Users can manage own decks"
  ON decks FOR ALL
  USING (auth.uid() = user_id);
```

**cards table:**
```sql
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Users can only see cards in their own decks
CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- Users can only modify cards in their own decks
CREATE POLICY "Users can manage own cards"
  ON cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );
```

**learned_words table:**
```sql
ALTER TABLE learned_words ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own learned words
CREATE POLICY "Users can manage own learned words"
  ON learned_words FOR ALL
  USING (auth.uid() = user_id);
```

**user_activities table:**
```sql
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users can only see/create their own activities
CREATE POLICY "Users can manage own activities"
  ON user_activities FOR ALL
  USING (auth.uid() = user_id);
```

**user_books table:**
```sql
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own books
CREATE POLICY "Users can manage own books"
  ON user_books FOR ALL
  USING (auth.uid() = user_id);
```

---

## Error Handling

### Frontend Error Handling Pattern

```javascript
try {
  const result = await apiFunction();
  // Success handling
} catch (error) {
  console.error('Operation failed:', error);
  
  // User-friendly error message
  if (error.message.includes('JWT')) {
    setError('Your session has expired. Please log in again.');
  } else if (error.message.includes('network')) {
    setError('Network error. Please check your connection.');
  } else {
    setError('An error occurred. Please try again.');
  }
  
  // Optional: Send to error tracking service
  // logErrorToSentry(error);
}
```

### Backend Error Response Format

```javascript
// Success Response
res.json({
  data: { /* result data */ },
  message: 'Operation successful'
});

// Error Response
res.status(400 | 401 | 403 | 404 | 500).json({
  error: 'User-friendly error message',
  details: 'Technical error details', // Optional, only in development
  code: 'ERROR_CODE' // Optional error code
});
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

### Frontend Rate Limiting

**Gemini API calls** (geminiApi.js):
- Minimum 1 second between calls
- Prevents API abuse
- Queues requests if called too quickly

```javascript
// Enforced automatically in callBackendAI()
await enforceRateLimit();
```

### Backend Rate Limiting (Recommended)

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.'
});

// Apply to all /api routes
app.use('/api/', limiter);
```

---

## Conclusion

Intuu's API architecture provides:
- **Type-safe database operations** via Supabase client
- **Secure authentication** with JWT tokens and RLS
- **AI integration** through backend proxy (Gemini, DeepL)
- **Scalable design** with separation of concerns
- **Error resilience** with comprehensive error handling

All APIs follow RESTful principles and return consistent JSON responses.

---

**Last Updated:** December 20, 2025  
**Version:** 1.0.0  
**Maintained By:** Intuu Development Team

---
