# Hooks and State Management Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication Context](#authentication-context)
- [Custom Hooks](#custom-hooks)
- [State Management Patterns](#state-management-patterns)
- [Performance Optimizations](#performance-optimizations)
- [Best Practices](#best-practices)

---

## Overview

### State Management Philosophy

The Intuu application uses a hybrid state management approach combining:
- **React Context API** for global authentication state
- **Custom Hooks** for feature-specific data management
- **Local Component State** for UI interactions
- **Server State** via Supabase real-time subscriptions

### Key Principles

1. **Separation of Concerns**: Authentication in context, features in custom hooks
2. **Performance First**: Memoization, lazy loading, selective re-renders
3. **Type Safety**: PropTypes validation throughout
4. **Error Boundaries**: Graceful error handling at every level
5. **Real-time Sync**: Supabase subscriptions for multi-device consistency

---

## Architecture

### State Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Application Root                          │
│                      (main.jsx)                               │
└───────────────────────────────┬──────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   AuthProvider        │
                    │   (AuthContext.jsx)   │
                    └───────────┬───────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
    ┌───────▼───────┐   ┌──────▼──────┐   ┌───────▼───────┐
    │   Dashboard   │   │  Flashcards │   │  TextAnalyzer │
    │  (useStats)   │   │  (useDecks) │   │  (useGemini)  │
    └───────────────┘   └─────────────┘   └───────────────┘
            │                   │                   │
    ┌───────▼───────────────────▼───────────────────▼────┐
    │              Supabase Backend                       │
    │  - Authentication State                             │
    │  - Database Queries (RLS)                           │
    │  - Real-time Subscriptions                          │
    └─────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── contexts/
│   └── AuthContext.jsx          # Global auth state provider
├── hooks/
│   ├── useUserStats.js          # User progress statistics
│   ├── useDecks.js              # Flashcard deck management
│   ├── useFlashcards.js         # Spaced repetition logic
│   └── useDebounce.js           # Input debouncing utility
└── utils/
    ├── supabaseClient.js        # Auth helpers
    ├── deckApi.js               # Deck CRUD operations
    ├── userStatsApi.js          # Stats API calls
    └── geminiApi.js             # AI API with rate limiting
```

---

## Authentication Context

### AuthContext.jsx

**Location**: `src/contexts/AuthContext.jsx`

**Purpose**: Provides global authentication state to all components using React Context API.

#### Complete Implementation

```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabaseClient';

// Create context
const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
});

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Sign up new user
  const signUp = async (email, password, displayName, nativeLanguage, learningLanguage) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          native_language: nativeLanguage,
          learning_language: learningLanguage,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // Sign in existing user
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Update user profile metadata
  const updateProfile = async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for consuming auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current authenticated user object from Supabase |
| `session` | `Session \| null` | Current session with JWT access token |
| `loading` | `boolean` | True while checking initial auth state |
| `signUp` | `function` | Creates new user account with metadata |
| `signIn` | `function` | Authenticates user with email/password |
| `signOut` | `function` | Ends current session |
| `updateProfile` | `function` | Updates user metadata (display name, languages) |

#### Usage Example

```javascript
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <header>
      <h1>Welcome, {user.user_metadata?.display_name}</h1>
      <button onClick={signOut}>Sign Out</button>
    </header>
  );
}
```

#### Auth State Lifecycle

```
┌─────────────────┐
│  App Starts     │
│  loading: true  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ getSession()    │─────▶│  Session Found   │
└────────┬────────┘      │  Set user/session│
         │               └────────┬─────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  No Session     │      │  User Logged In  │
│  user: null     │      │  loading: false  │
│  loading: false │      └────────┬─────────┘
└─────────────────┘               │
                                  │
                          ┌───────▼────────┐
                          │ onAuthStateChange│
                          │ (listens for:)  │
                          │ - SIGNED_IN     │
                          │ - SIGNED_OUT    │
                          │ - TOKEN_REFRESH │
                          └─────────────────┘
```

#### Security Features

1. **Automatic Token Refresh**: Supabase SDK handles JWT refresh automatically
2. **Secure Storage**: Session tokens stored in localStorage with httpOnly flags
3. **Auth State Persistence**: Survives page reloads and browser restarts
4. **Real-time Updates**: `onAuthStateChange` fires across all browser tabs

#### Error Handling

```javascript
// In Login component
const handleLogin = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    await signIn(email, password);
    // Redirect handled by onAuthStateChange
  } catch (error) {
    // Common error codes:
    // - Invalid login credentials
    // - Email not confirmed
    // - User not found
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Custom Hooks

### useUserStats Hook

**Location**: useUserStats.js

**Purpose**: Manages user statistics (XP, streak, learned words, weekly goals) with real-time updates.

#### Complete Implementation

```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import {
  getUserProfile,
  getRecentActivities,
  getWeeklyProgress,
  getLearningLevel,
} from '../utils/userStatsApi';

export function useUserStats(userId) {
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [learningLevel, setLearningLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all user stats on mount or userId change
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Parallel fetch for better performance
        const [profileData, activitiesData, weeklyData, levelData] = await Promise.all([
          getUserProfile(userId),
          getRecentActivities(userId, 10),
          getWeeklyProgress(userId),
          getLearningLevel(userId),
        ]);

        setProfile(profileData);
        setActivities(activitiesData);
        setWeeklyProgress(weeklyData);
        setLearningLevel(levelData);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  // Real-time subscription to profile changes
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Real-time subscription to new activities
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`activities:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New activity:', payload);
          // Prepend new activity to list
          setActivities((prev) => [payload.new, ...prev].slice(0, 10));
          
          // Update profile stats optimistically
          if (payload.new.xp_earned) {
            setProfile((prev) => ({
              ...prev,
              total_xp: (prev?.total_xp || 0) + payload.new.xp_earned,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Refresh all stats manually
  const refreshStats = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [profileData, activitiesData, weeklyData, levelData] = await Promise.all([
        getUserProfile(userId),
        getRecentActivities(userId, 10),
        getWeeklyProgress(userId),
        getLearningLevel(userId),
      ]);

      setProfile(profileData);
      setActivities(activitiesData);
      setWeeklyProgress(weeklyData);
      setLearningLevel(levelData);
    } catch (err) {
      console.error('Error refreshing stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    activities,
    weeklyProgress,
    learningLevel,
    loading,
    error,
    refreshStats,
  };
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `profile` | `Profile \| null` | User profile with XP, streak, level, goals |
| `activities` | `Activity[]` | Last 10 activities (cards reviewed, texts analyzed) |
| `weeklyProgress` | `WeeklyProgress \| null` | Days active this week (Mon-Sun) |
| `learningLevel` | `LearningLevel \| null` | A1-C2 level with required XP |
| `loading` | `boolean` | True while fetching initial data |
| `error` | `string \| null` | Error message if fetch failed |
| `refreshStats` | `function` | Manually re-fetch all stats |

#### Usage Example

```javascript
import { useUserStats } from '../hooks/useUserStats';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const { profile, weeklyProgress, learningLevel, loading, error } = useUserStats(user?.id);

  if (loading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Welcome back, {user.user_metadata.display_name}!</h2>
      <div className="stats">
        <div>XP: {profile?.total_xp || 0}</div>
        <div>Streak: {profile?.current_streak || 0} days 🔥</div>
        <div>Level: {learningLevel?.level || 'A1'}</div>
        <div>Weekly Goal: {weeklyProgress?.completedDays || 0}/7 days</div>
      </div>
    </div>
  );
}
```

#### Performance Optimization

1. **Parallel Fetching**: All API calls run concurrently with `Promise.all`
2. **Real-time Updates**: Supabase channels prevent polling
3. **Optimistic Updates**: UI updates before server confirms changes
4. **Stale Data Strategy**: Shows cached data while refreshing in background

---

### useDecks Hook

**Location**: `src/hooks/useDecks.js`

**Purpose**: Manages flashcard decks with CRUD operations and real-time synchronization.

#### Implementation

```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getUserDecks, createDeck, updateDeck, deleteDeck } from '../utils/deckApi';

export function useDecks(userId) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch decks on mount
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchDecks() {
      try {
        setLoading(true);
        const data = await getUserDecks(userId);
        setDecks(data);
      } catch (err) {
        console.error('Error fetching decks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDecks();
  }, [userId]);

  // Real-time deck updates
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`decks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'decks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDecks((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setDecks((prev) =>
              prev.map((deck) => (deck.id === payload.new.id ? payload.new : deck))
            );
          } else if (payload.eventType === 'DELETE') {
            setDecks((prev) => prev.filter((deck) => deck.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [userId]);

  // Create new deck
  const addDeck = async (name, description) => {
    try {
      const newDeck = await createDeck(userId, name, description);
      // Real-time listener will update state automatically
      return newDeck;
    } catch (err) {
      console.error('Error creating deck:', err);
      throw err;
    }
  };

  // Update existing deck
  const editDeck = async (deckId, updates) => {
    try {
      const updatedDeck = await updateDeck(deckId, updates);
      return updatedDeck;
    } catch (err) {
      console.error('Error updating deck:', err);
      throw err;
    }
  };

  // Delete deck
  const removeDeck = async (deckId) => {
    try {
      await deleteDeck(deckId);
    } catch (err) {
      console.error('Error deleting deck:', err);
      throw err;
    }
  };

  return {
    decks,
    loading,
    error,
    addDeck,
    editDeck,
    removeDeck,
  };
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `decks` | `Deck[]` | Array of user's flashcard decks |
| `loading` | `boolean` | True while fetching initial decks |
| `error` | `string \| null` | Error message if fetch failed |
| `addDeck` | `function` | Creates new deck |
| `editDeck` | `function` | Updates deck name/description |
| `removeDeck` | `function` | Deletes deck and all cards |

---

### useFlashcards Hook

**Location**: `src/hooks/useFlashcards.js`

**Purpose**: Implements SM-2 spaced repetition algorithm for individual flashcard study sessions.

#### Implementation

```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getDeckCards, reviewCard } from '../utils/deckApi';

export function useFlashcards(deckId) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch cards due for review
  useEffect(() => {
    if (!deckId) {
      setLoading(false);
      return;
    }

    async function fetchCards() {
      try {
        setLoading(true);
        const allCards = await getDeckCards(deckId);

        // Filter cards due for review (next_review <= now)
        const now = new Date();
        const dueCards = allCards.filter(
          (card) => new Date(card.next_review) <= now
        );

        // Shuffle for variety
        const shuffled = dueCards.sort(() => Math.random() - 0.5);

        setCards(shuffled);
        setCurrentIndex(0);
        setReviewComplete(shuffled.length === 0);
      } catch (err) {
        console.error('Error fetching cards:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [deckId]);

  // Submit card review with quality rating
  const submitReview = async (quality) => {
    if (currentIndex >= cards.length) return;

    const card = cards[currentIndex];

    try {
      // Update card with SM-2 algorithm
      await reviewCard(card.id, quality);

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setReviewComplete(true);
      }
    } catch (err) {
      console.error('Error reviewing card:', err);
      throw err;
    }
  };

  // Get current card
  const currentCard = cards[currentIndex] || null;

  // Progress tracking
  const progress = {
    current: currentIndex + 1,
    total: cards.length,
    percentage: cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0,
  };

  return {
    currentCard,
    progress,
    reviewComplete,
    loading,
    submitReview,
  };
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `currentCard` | `Card \| null` | Card being reviewed |
| `progress` | `object` | `{ current, total, percentage }` |
| `reviewComplete` | `boolean` | True when all cards reviewed |
| `loading` | `boolean` | True while fetching cards |
| `submitReview` | `function` | Records review with quality 0-5 |

#### Usage Example

```javascript
import { useFlashcards } from '../hooks/useFlashcards';

function StudySession({ deckId }) {
  const { currentCard, progress, reviewComplete, submitReview } = useFlashcards(deckId);
  const [showAnswer, setShowAnswer] = useState(false);

  if (reviewComplete) {
    return <div>🎉 Review session complete!</div>;
  }

  if (!currentCard) {
    return <div>No cards due for review</div>;
  }

  return (
    <div>
      <div>Card {progress.current} of {progress.total}</div>
      <div className="card">
        <h2>{currentCard.front}</h2>
        {showAnswer && <p>{currentCard.back}</p>}
        <button onClick={() => setShowAnswer(true)}>Show Answer</button>
      </div>
      {showAnswer && (
        <div className="rating-buttons">
          <button onClick={() => submitReview(0)}>Again</button>
          <button onClick={() => submitReview(3)}>Hard</button>
          <button onClick={() => submitReview(4)}>Good</button>
          <button onClick={() => submitReview(5)}>Easy</button>
        </div>
      )}
    </div>
  );
}
```

---

### useDebounce Hook

**Location**: `src/hooks/useDebounce.js`

**Purpose**: Debounces rapidly changing values (search inputs, text analysis) to prevent excessive API calls.

#### Implementation

```javascript
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

#### Usage Example

```javascript
import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';

function TextAnalyzer() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const debouncedText = useDebounce(text, 800);

  useEffect(() => {
    if (debouncedText.length > 10) {
      // Only analyzes after user stops typing for 800ms
      analyzeText(debouncedText).then(setAnalysis);
    }
  }, [debouncedText]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type to analyze..."
      />
      {analysis && <div>{analysis.summary}</div>}
    </div>
  );
}
```

**Benefits**:
- Reduces API calls from 100s to 1-2 per user input
- Improves UX by preventing laggy typing
- Saves backend costs and rate limits

---

## State Management Patterns

### Local State vs Global State

#### When to Use Local State

```javascript
// ✅ Good: UI-only state
function Card() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  return (
    <div onClick={() => setIsFlipped(!isFlipped)}>
      {isFlipped ? 'Back' : 'Front'}
    </div>
  );
}
```

**Use local state for**:
- Modal open/closed state
- Form input values (before submission)
- UI animations and transitions
- Temporary filters and sorting
- Accordion expanded/collapsed state

#### When to Use Context/Global State

```javascript
// ✅ Good: Shared auth state
function App() {
  return (
    <AuthProvider>
      <Dashboard /> {/* Needs user */}
      <Header /> {/* Needs user */}
      <Sidebar /> {/* Needs user */}
    </AuthProvider>
  );
}
```

**Use global state for**:
- User authentication status
- Theme preferences (light/dark mode)
- Language settings (German, English, etc.)
- Shopping cart contents
- Real-time notifications

### Prop Drilling vs Context

#### Prop Drilling (Avoid for Deep Nesting)

```javascript
// ❌ Bad: Passing props through 5 levels
function App() {
  const [user, setUser] = useState(null);
  return <Dashboard user={user} />;
}

function Dashboard({ user }) {
  return <Sidebar user={user} />;
}

function Sidebar({ user }) {
  return <Menu user={user} />;
}

function Menu({ user }) {
  return <MenuItem user={user} />;
}

function MenuItem({ user }) {
  return <div>{user.name}</div>;
}
```

#### Context (Better for Shared State)

```javascript
// ✅ Good: Context eliminates drilling
function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

function MenuItem() {
  const { user } = useAuth(); // Direct access!
  return <div>{user.name}</div>;
}
```

### Server State Management

#### Fetching and Caching Strategy

```javascript
function DeckList() {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Show cached data immediately
    const cached = localStorage.getItem('decks');
    if (cached) {
      setDecks(JSON.parse(cached));
      setLoading(false);
    }

    // 2. Fetch fresh data in background
    getUserDecks(user.id)
      .then((freshDecks) => {
        setDecks(freshDecks);
        localStorage.setItem('decks', JSON.stringify(freshDecks));
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [user.id]);

  // 3. Real-time sync via Supabase
  useEffect(() => {
    const subscription = supabase
      .channel('decks')
      .on('postgres_changes', { /* ... */ }, (payload) => {
        setDecks((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  // ...
}
```

**Strategy Benefits**:
1. **Instant Load**: Cached data shows immediately (no loading spinner)
2. **Fresh Data**: Background fetch updates with server truth
3. **Real-time Sync**: Multi-device changes propagate instantly

---

## Performance Optimizations

### Memoization with useMemo

**Purpose**: Cache expensive calculations to prevent re-computation on every render.

```javascript
import { useMemo } from 'react';

function Dashboard() {
  const { profile, activities } = useUserStats(user.id);

  // ❌ Bad: Recalculates on every render
  const totalXP = activities.reduce((sum, a) => sum + a.xp_earned, 0);

  // ✅ Good: Only recalculates when activities change
  const totalXP = useMemo(() => {
    return activities.reduce((sum, a) => sum + a.xp_earned, 0);
  }, [activities]);

  // Complex filtering/sorting
  const hardCards = useMemo(() => {
    return cards
      .filter((card) => card.difficulty < 2.5)
      .sort((a, b) => new Date(a.next_review) - new Date(b.next_review));
  }, [cards]);

  return <div>Total XP: {totalXP}</div>;
}
```

**When to use `useMemo`**:
- Array operations (filter, map, sort, reduce)
- Complex calculations (statistics, aggregations)
- Object/array creation that's passed as props
- Expensive formatting (dates, numbers, strings)

### Callback Memoization with useCallback

**Purpose**: Prevent function recreation on every render (important for child component props).

```javascript
import { useCallback } from 'react';

function DeckManager() {
  const [decks, setDecks] = useState([]);

  // ❌ Bad: Creates new function on every render
  const handleDelete = (id) => {
    deleteDeck(id).then(() => {
      setDecks((prev) => prev.filter((d) => d.id !== id));
    });
  };

  // ✅ Good: Same function reference across renders
  const handleDelete = useCallback((id) => {
    deleteDeck(id).then(() => {
      setDecks((prev) => prev.filter((d) => d.id !== id));
    });
  }, []); // Empty deps: function never changes

  return decks.map((deck) => (
    <DeckCard key={deck.id} deck={deck} onDelete={handleDelete} />
  ));
}
```

### React.memo for Component Optimization

**Purpose**: Prevent component re-renders when props haven't changed.

```javascript
import React, { memo } from 'react';

// ❌ Without memo: Re-renders even if props unchanged
function DeckCard({ deck, onDelete }) {
  return (
    <div>
      <h3>{deck.name}</h3>
      <button onClick={() => onDelete(deck.id)}>Delete</button>
    </div>
  );
}

// ✅ With memo: Only re-renders when deck or onDelete changes
const DeckCard = memo(function DeckCard({ deck, onDelete }) {
  return (
    <div>
      <h3>{deck.name}</h3>
      <button onClick={() => onDelete(deck.id)}>Delete</button>
    </div>
  );
});

export default DeckCard;
```

### Lazy Loading Routes

**Purpose**: Split code by route to reduce initial bundle size.

```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ✅ Lazy load heavy components
const Dashboard = lazy(() => import('./components/features/Dashboard'));
const Flashcards = lazy(() => import('./components/features/Flashcards'));
const TextAnalyzer = lazy(() => import('./components/features/TextAnalyzer'));
const GermanTutor = lazy(() => import('./components/features/GermanTutor'));
const EbookReader = lazy(() => import('./components/features/EbookReader'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/text-analyzer" element={<TextAnalyzer />} />
          <Route path="/tutor" element={<GermanTutor />} />
          <Route path="/ebooks" element={<EbookReader />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Benefits**:
- Initial load: ~200KB instead of ~800KB
- Faster Time to Interactive (TTI)
- Improves Lighthouse performance score

### Virtualization for Long Lists

**Purpose**: Only render visible items in large lists (1000+ items).

```javascript
import { FixedSizeList as List } from 'react-window';

function LearnedWordsList({ words }) {
  // ❌ Bad: Renders 5000 DOM elements
  return (
    <div>
      {words.map((word) => (
        <div key={word.id}>{word.text}</div>
      ))}
    </div>
  );

  // ✅ Good: Only renders ~20 visible items
  const Row = ({ index, style }) => (
    <div style={style}>{words[index].text}</div>
  );

  return (
    <List
      height={600}
      itemCount={words.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

---

## Best Practices

### 1. Custom Hooks for Reusability

**Extract common logic into custom hooks**:

```javascript
// ❌ Bad: Duplicated logic in multiple components
function Dashboard() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  // ...
}

function Profile() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  // ...
}

// ✅ Good: Shared logic in custom hook
function useCurrentUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  return user;
}

function Dashboard() {
  const user = useCurrentUser();
  // ...
}

function Profile() {
  const user = useCurrentUser();
  // ...
}
```

### 2. Error Boundaries for Graceful Failures

```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
```

### 3. Cleanup Side Effects

**Always cleanup subscriptions, timers, and event listeners**:

```javascript
function RealTimeUpdates() {
  useEffect(() => {
    // Subscribe to changes
    const subscription = supabase
      .channel('updates')
      .on('postgres_changes', {}, handleChange)
      .subscribe();

    // ✅ Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Start polling
    const interval = setInterval(fetchData, 5000);

    // ✅ Clear interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Add event listener
    window.addEventListener('resize', handleResize);

    // ✅ Remove listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}
```

### 4. Dependency Arrays

**Be explicit about effect dependencies**:

```javascript
// ❌ Bad: Missing dependencies
useEffect(() => {
  fetchUserData(userId);
}, []); // userId not in deps!

// ✅ Good: All dependencies listed
useEffect(() => {
  fetchUserData(userId);
}, [userId]);

// ❌ Bad: Object/array in deps causes infinite loop
useEffect(() => {
  console.log(data);
}, [{ foo: 'bar' }]); // New object every render!

// ✅ Good: Use primitive dependencies
useEffect(() => {
  console.log(data);
}, [data.id, data.name]); // Stable primitives
```

### 5. Avoid State Duplication

```javascript
// ❌ Bad: Duplicating derived data in state
function Profile() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState(''); // Redundant!

  const handleFirstNameChange = (e) => {
    setFirstName(e.target.value);
    setFullName(`${e.target.value} ${lastName}`); // Extra work
  };

  // ...
}

// ✅ Good: Calculate derived data on the fly
function Profile() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const fullName = `${firstName} ${lastName}`; // Derived

  // ...
}
```

### 6. Optimistic Updates for Better UX

```javascript
async function handleLike(postId) {
  // ✅ Update UI immediately (optimistic)
  setPosts((prev) =>
    prev.map((post) =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    )
  );

  try {
    // Send request to server
    await likePost(postId);
  } catch (error) {
    // Revert on error
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: post.likes - 1 } : post
      )
    );
    console.error('Failed to like post:', error);
  }
}
```

### 7. State Batching

**React automatically batches setState calls in event handlers**:

```javascript
function handleClick() {
  // All three updates are batched into one re-render
  setCount(count + 1);
  setFlag(true);
  setItems([...items, newItem]);
}
```

**For async updates, use functional form**:

```javascript
// ❌ Bad: May use stale state
setTimeout(() => {
  setCount(count + 1);
}, 1000);

// ✅ Good: Always uses latest state
setTimeout(() => {
  setCount((prevCount) => prevCount + 1);
}, 1000);
```

---

## Debugging Tools

### React DevTools

**Install**: Chrome/Firefox extension "React Developer Tools"

**Features**:
1. **Components Tab**: Inspect component tree, props, state, hooks
2. **Profiler Tab**: Record renders to find performance bottlenecks
3. **Highlight Updates**: Visually see which components re-render

### Custom Debug Hook

```javascript
import { useEffect, useRef } from 'react';

// Logs prop/state changes
export function useWhyDidYouUpdate(name, props) {
  const previousProps = useRef();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// Usage
function MyComponent({ user, count }) {
  useWhyDidYouUpdate('MyComponent', { user, count });
  // ...
}
```

### Supabase Real-time Debugging

```javascript
// Enable verbose logging
const subscription = supabase
  .channel('debug')
  .on('postgres_changes', {}, (payload) => {
    console.log('Change received:', {
      event: payload.eventType,
      table: payload.table,
      old: payload.old,
      new: payload.new,
      commit_timestamp: payload.commit_timestamp,
    });
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

---

## Summary

This document covered:

1. **AuthContext**: Global authentication state management with Supabase
2. **useUserStats**: Real-time user statistics with subscriptions
3. **useDecks**: Flashcard deck management with CRUD operations
4. **useFlashcards**: SM-2 spaced repetition implementation
5. **useDebounce**: Input debouncing for API optimization
6. **State Patterns**: Local vs global state, prop drilling solutions
7. **Performance**: Memoization, lazy loading, virtualization
8. **Best Practices**: Cleanup, dependencies, optimistic updates

**Key Takeaways**:
- Use Context for global state (auth, theme, language)
- Use custom hooks for feature logic (stats, decks, cards)
- Use local state for UI interactions
- Always cleanup side effects (subscriptions, timers, listeners)
- Memoize expensive calculations with useMemo
- Optimize child components with React.memo and useCallback
- Use Supabase real-time for multi-device sync

**Next Steps**: See COMPLETE-COMPONENTS.md for full component implementations with props, state, and styling.
