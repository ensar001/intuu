
# Intuu Platform - Core Features Documentation

## Table of Contents
1. [Dashboard](#dashboard)
2. [Flashcard System](#flashcard-system)
3. [Text Analyzer](#text-analyzer)
4. [AI Language Tutor](#ai-language-tutor)
5. [E-Book Reader System](#e-book-reader-system)
6. [Settings Management](#settings-management)
7. [Statistics Pages](#statistics-pages)

---

## Dashboard

**File:** [src/components/features/Dashboard.jsx](src/components/features/Dashboard.jsx)

### Purpose
The Dashboard serves as the user's homepage, displaying comprehensive learning statistics, current progress, and motivational metrics. It provides at-a-glance insights into study streaks, XP points, words mastered, and CEFR language level.

### Component Structure

```javascript
export default function Dashboard() {
  const { user, profile } = useAuth();
  const { stats, learningLevel, weeklyGoalProgress, loading } = useUserStats();

  // Main sections:
  // 1. Welcome header with username
  // 2. Primary stats grid (4 cards)
  // 3. Level progress bar
  // 4. Weekly goal progress ring
}
```

### Key Features

#### 1. Welcome Section
```javascript
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-900">
    Welcome back, {profile?.username || user?.email?.split('@')[0]}!
  </h1>
  <p className="text-gray-600 mt-2">
    Here's your learning progress
  </p>
</div>
```
- Displays personalized greeting
- Uses username if set, otherwise extracts name from email
- Subtitle provides context

#### 2. Stats Grid
Displays 4 primary metrics in card format:

**Streak Counter**
```javascript
<Card className="bg-gradient-to-br from-orange-500 to-red-600">
  <Flame className="h-8 w-8 text-white" />
  <div className="text-4xl font-bold text-white">
    {stats.current_streak || 0}
  </div>
  <div className="text-white/90">Day Streak</div>
</Card>
```
- Orange-to-red gradient
- Flame icon (Lucide React)
- Shows `current_streak` from database
- Updates daily when user completes any activity

**Words Mastered**
```javascript
<Card className="bg-gradient-to-br from-blue-500 to-purple-600">
  <BookOpen className="h-8 w-8 text-white" />
  <div className="text-4xl font-bold text-white">
    {stats.words_mastered || 0}
  </div>
  <div className="text-white/90">Words Mastered</div>
</Card>
```
- Blue-to-purple gradient
- BookOpen icon
- Counts cards with `mastery_level = 3`
- Updated by `learnWord()` function

**XP Points**
```javascript
<Card className="bg-gradient-to-br from-green-500 to-teal-600">
  <Trophy className="h-8 w-8 text-white" />
  <div className="text-4xl font-bold text-white">
    {stats.xp_points || 0}
  </div>
  <div className="text-white/90">XP Points</div>
</Card>
```
- Green-to-teal gradient
- Trophy icon
- Accumulated from all activities
- Used for level calculation

**Study Time**
```javascript
<Card className="bg-gradient-to-br from-pink-500 to-rose-600">
  <Clock className="h-8 w-8 text-white" />
  <div className="text-4xl font-bold text-white">
    {Math.floor((stats.study_time_minutes || 0) / 60)}h {(stats.study_time_minutes || 0) % 60}m
  </div>
  <div className="text-white/90">Study Time</div>
</Card>
```
- Pink-to-rose gradient
- Clock icon
- Converts minutes to hours:minutes format
- Tracks total study duration

#### 3. Learning Level Progress
```javascript
<Card>
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold">Learning Level</h3>
      <p className="text-sm text-gray-600">
        {learningLevel.label} ({learningLevel.level})
      </p>
    </div>
    <Target className="h-8 w-8 text-blue-600" />
  </div>
  
  {/* Progress bar */}
  <div className="relative w-full h-4 bg-gray-200 rounded-full">
    <div 
      className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
      style={{ width: `${progressToNextLevel}%` }}
    />
  </div>
  
  <div className="mt-2 text-sm text-gray-600">
    {stats.words_mastered || 0} / {nextLevelThreshold} words
  </div>
</Card>
```

**CEFR Level Calculation:**
```javascript
// From useUserStats.js
const calculateLearningLevel = (wordsMastered) => {
  if (wordsMastered < 100) return { level: 'A1', label: 'Beginner' };
  if (wordsMastered < 300) return { level: 'A2', label: 'Elementary' };
  if (wordsMastered < 600) return { level: 'B1', label: 'Intermediate' };
  if (wordsMastered < 1000) return { level: 'B2', label: 'Upper Intermediate' };
  if (wordsMastered < 2000) return { level: 'C1', label: 'Advanced' };
  return { level: 'C2', label: 'Mastery' };
};
```

**Thresholds:**
- A1 (Beginner): 0-99 words
- A2 (Elementary): 100-299 words
- B1 (Intermediate): 300-599 words
- B2 (Upper Intermediate): 600-999 words
- C1 (Advanced): 1000-1999 words
- C2 (Mastery): 2000+ words

#### 4. Weekly Goal Progress
```javascript
<Card>
  <h3 className="text-lg font-semibold mb-4">Weekly Goal</h3>
  
  {/* Circular progress ring */}
  <div className="flex items-center justify-center">
    <svg className="w-48 h-48 transform -rotate-90">
      {/* Background circle */}
      <circle
        cx="96" cy="96" r="88"
        stroke="#e5e7eb"
        strokeWidth="12"
        fill="none"
      />
      
      {/* Progress arc */}
      <circle
        cx="96" cy="96" r="88"
        stroke="#3b82f6"
        strokeWidth="12"
        fill="none"
        strokeDasharray={`${2 * Math.PI * 88}`}
        strokeDashoffset={`${2 * Math.PI * 88 * (1 - weeklyGoalProgress / 100)}`}
        strokeLinecap="round"
      />
    </svg>
    
    {/* Center text */}
    <div className="absolute text-center">
      <div className="text-4xl font-bold">{Math.round(weeklyGoalProgress)}%</div>
      <div className="text-gray-600">Complete</div>
    </div>
  </div>
  
  <p className="text-center mt-4">
    {stats.flashcard_reviews_week || 0} / {stats.weekly_goal || 50} cards reviewed
  </p>
</Card>
```

**Weekly Goal Calculation:**
```javascript
// From useUserStats.js
const weeklyGoalProgress = useMemo(() => {
  if (!stats.weekly_goal || stats.weekly_goal === 0) return 0;
  return Math.min((stats.flashcard_reviews_week / stats.weekly_goal) * 100, 100);
}, [stats.flashcard_reviews_week, stats.weekly_goal]);
```
- Calculates percentage of weekly goal completed
- Caps at 100% (doesn't show > 100%)
- Default goal: 50 cards/week
- Resets every Monday (handled by database trigger)

### Data Flow

```
Dashboard Component
    ↓
useUserStats() hook
    ↓
Supabase query (profiles table)
    ↓
{
  current_streak: 5,
  words_mastered: 247,
  xp_points: 1850,
  study_time_minutes: 420,
  weekly_goal: 50,
  flashcard_reviews_week: 32
}
    ↓
Derived calculations:
  - learningLevel = 'A2' (Elementary)
  - weeklyGoalProgress = 64%
  - progressToNextLevel = 82.3%
    ↓
Render UI with stats
```

### Loading States
```javascript
{loading ? (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
) : (
  // ... stats grid
)}
```

### Error Handling
- If stats fail to load, shows empty state with 0 values
- No error message shown to user (graceful degradation)
- Console logs errors in development

---

## Flashcard System

**Files:**
- Flashcards.jsx - Main study interface
- DeckSelector.jsx - Deck selection modal
- deckApi.js - API functions

### Purpose
Implements a spaced repetition flashcard system using the **SuperMemo 2 (SM-2) algorithm** for optimized vocabulary retention. Users study cards in decks, mark cards as correct/incorrect, and the system schedules next review dates based on performance.

### Component Structure

```javascript
export default function Flashcards() {
  const [cards, setCards] = useState([]);           // Current deck's cards
  const [currentIndex, setCurrentIndex] = useState(0); // Active card index
  const [isFlipped, setIsFlipped] = useState(false);   // Card flip state
  const [showDeckSelector, setShowDeckSelector] = useState(true); // Modal visibility
  const [selectedDeck, setSelectedDeck] = useState(null); // Active deck
  
  // ...
}
```

### SuperMemo 2 (SM-2) Algorithm

**Algorithm Overview:**
The SM-2 algorithm schedules flashcard reviews based on:
1. **Repetition number** - How many times reviewed
2. **Easiness factor** - Card difficulty (1.3 to 2.5)
3. **Interval** - Days until next review

**Implementation:**
```javascript
// src/utils/deckApi.js
export const calculateNextReviewDate = (quality, repetitions, easinessFactor, interval) => {
  // quality: 0-5 (0 = complete blackout, 5 = perfect recall)
  
  let newEF = easinessFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Update easiness factor
  newEF = Math.max(1.3, easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // If quality < 3 (incorrect), reset repetitions
  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1; // Review tomorrow
  } else {
    newRepetitions += 1;
    
    // Calculate new interval
    if (newRepetitions === 1) {
      newInterval = 1; // First correct: 1 day
    } else if (newRepetitions === 2) {
      newInterval = 6; // Second correct: 6 days
    } else {
      newInterval = Math.round(interval * newEF); // Subsequent: exponential growth
    }
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    next_review_at: nextReview.toISOString(),
    easiness_factor: newEF,
    repetitions: newRepetitions,
    interval: newInterval
  };
};
```

**Example Progression:**
```
Card: "Hund" → "Dog"

Review 1: Correct (quality = 5)
  - Repetitions: 0 → 1
  - Interval: 0 → 1 day
  - Next review: Tomorrow

Review 2: Correct (quality = 5)
  - Repetitions: 1 → 2
  - Interval: 1 → 6 days
  - Next review: 6 days from now

Review 3: Correct (quality = 4)
  - Repetitions: 2 → 3
  - Easiness: 2.5 → 2.4
  - Interval: 6 → 14 days (6 * 2.4)
  - Next review: 14 days from now

Review 4: Incorrect (quality = 2)
  - Repetitions: 3 → 0 (RESET)
  - Interval: 14 → 1 day
  - Next review: Tomorrow (back to start)
```

### Deck Selection Flow

**DeckSelector Component:**
```javascript
export default function DeckSelector({ onDeckSelect, onClose }) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadDecks = async () => {
      const userDecks = await deckApi.getUserDecks(user.id);
      setDecks(userDecks);
      setLoading(false);
    };
    loadDecks();
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">Select a Deck</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {decks.map(deck => (
            <div
              key={deck.id}
              onClick={() => onDeckSelect(deck)}
              className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer"
            >
              <h3 className="font-semibold">{deck.name}</h3>
              <p className="text-sm text-gray-600">
                {deck.card_count || 0} cards
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Card Study Interface

**Card Display:**
```javascript
const currentCard = cards[currentIndex];

<div className="max-w-2xl mx-auto">
  {/* Progress indicator */}
  <div className="mb-4 text-center text-gray-600">
    Card {currentIndex + 1} of {cards.length}
  </div>
  
  {/* Flashcard */}
  <div
    onClick={() => setIsFlipped(!isFlipped)}
    className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] flex items-center justify-center cursor-pointer"
  >
    <div className="text-center">
      <div className="text-3xl font-bold mb-4">
        {isFlipped ? currentCard.back_text : currentCard.front_text}
      </div>
      <div className="text-gray-500">
        {isFlipped ? 'English' : 'German'}
      </div>
    </div>
  </div>
  
  {/* Action buttons */}
  {isFlipped && (
    <div className="flex gap-4 mt-6">
      <Button
        onClick={() => handleAnswer(false)}
        variant="secondary"
        className="flex-1"
      >
        I Don't Know
      </Button>
      <Button
        onClick={() => handleAnswer(true)}
        variant="primary"
        className="flex-1"
      >
        I Know This
      </Button>
    </div>
  )}
</div>
```

### Answer Processing

**Correct Answer:**
```javascript
const handleAnswer = async (isCorrect) => {
  const card = cards[currentIndex];
  
  // Calculate quality score
  const quality = isCorrect ? 5 : 2; // Perfect recall or failure
  
  // Calculate next review using SM-2
  const {
    next_review_at,
    easiness_factor,
    repetitions,
    interval
  } = calculateNextReviewDate(
    quality,
    card.repetitions,
    card.easiness_factor,
    card.interval
  );
  
  // Update card in database
  await deckApi.updateCard(card.id, {
    next_review_at,
    easiness_factor,
    repetitions,
    interval,
    times_correct: isCorrect ? card.times_correct + 1 : card.times_correct,
    times_incorrect: !isCorrect ? card.times_incorrect + 1 : card.times_incorrect,
    last_reviewed_at: new Date().toISOString()
  });
  
  // If mastered (3+ correct reviews), record as learned word
  const newMastery = Math.min(
    isCorrect ? card.mastery_level + 1 : Math.max(0, card.mastery_level - 1),
    3
  );
  
  if (newMastery === 3 && card.mastery_level < 3) {
    await learnWord(card.front_text, 'de', card.id, 3);
  }
  
  // Record activity for streak tracking
  await recordActivity('flashcard_reviews', 1);
  
  // Move to next card
  setIsFlipped(false);
  setCurrentIndex(prev => prev + 1);
  
  // If finished deck, show completion message
  if (currentIndex + 1 >= cards.length) {
    // Show completion modal
  }
};
```

### Mastery Levels

```javascript
// 0 = New (never studied)
// 1 = Learning (1-2 correct reviews)
// 2 = Familiar (3-4 correct reviews)
// 3 = Mastered (5+ correct reviews, counts toward words_mastered stat)

const getMasteryColor = (level) => {
  switch (level) {
    case 0: return 'bg-gray-300';    // New
    case 1: return 'bg-yellow-400';  // Learning
    case 2: return 'bg-blue-500';    // Familiar
    case 3: return 'bg-green-600';   // Mastered
  }
};
```

### Database Schema

**Tables Used:**
```sql
-- Deck storage
decks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  description TEXT,
  language_from TEXT,
  language_to TEXT,
  created_at TIMESTAMP
)

-- Card storage
cards (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES decks,
  front_text TEXT,
  back_text TEXT,
  mastery_level INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  easiness_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  next_review_at TIMESTAMP,
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Learned words tracking
learned_words (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  word TEXT,
  language TEXT,
  card_id UUID REFERENCES cards,
  mastery_level INTEGER,
  learned_at TIMESTAMP
)
```

### Data Flow

```
1. User clicks "Study" → Shows DeckSelector modal
2. User selects deck → Loads cards due for review
3. Shows first card (front side) → User clicks to flip
4. Shows back side → User rates (Know/Don't Know)
5. Calculates next review date (SM-2 algorithm)
6. Updates card in database
7. If mastery_level reaches 3 → Adds to learned_words table
8. Records activity → Updates current_streak if first today
9. Shows next card → Repeat until deck finished
10. Shows completion modal → Returns to deck selector
```

---

## Text Analyzer

**File:** TextAnalyzer.jsx

### Purpose
AI-powered grammar analysis tool using Google Gemini 2.5 Flash. Users paste German text, and the AI provides detailed feedback on grammar errors, stylistic improvements, and language proficiency assessment.

### Component Structure

```javascript
export default function TextAnalyzer() {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { recordActivity } = useUserStats();

  // ...
}
```

### User Interface

```javascript
<div className="max-w-4xl mx-auto">
  <h1 className="text-3xl font-bold mb-6">Text Analyzer</h1>
  
  {/* Input Section */}
  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Paste your German text here
    </label>
    <textarea
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
      className="w-full h-48 p-4 border rounded-lg resize-none"
      placeholder="Enter German text for analysis..."
    />
    
    <div className="flex justify-between items-center mt-4">
      <span className="text-sm text-gray-500">
        {inputText.length} characters
      </span>
      <Button
        onClick={handleAnalyze}
        disabled={!inputText.trim() || loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Text'}
      </Button>
    </div>
  </div>
  
  {/* Results Section */}
  {analysis && (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
      <div className="prose prose-sm max-w-none">
        {/* Markdown-formatted analysis */}
        <pre className="whitespace-pre-wrap">{analysis}</pre>
      </div>
    </div>
  )}
</div>
```

### AI Analysis Flow

```javascript
const handleAnalyze = async () => {
  if (!inputText.trim()) return;
  
  setLoading(true);
  setError('');
  
  try {
    // Call backend AI service
    const result = await geminiApi.callBackendAI(
      inputText,
      'analyze-text' // Specific endpoint for grammar analysis
    );
    
    setAnalysis(result);
    
    // Record activity (XP + streak)
    await recordActivity('text_analysis', 1);
    
  } catch (err) {
    setError('Failed to analyze text. Please try again.');
    console.error('Analysis error:', err);
  } finally {
    setLoading(false);
  }
};
```

### Backend AI Integration

**Route:** ai.js

```javascript
router.post('/analyze-text', authenticateUser, async (req, res) => {
  const { text } = req.body;
  
  // Input validation
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
  }
  
  try {
    // Call Gemini AI with specialized prompt
    const prompt = `You are a German language teacher analyzing student writing.

Analyze this German text for:
1. Grammar errors (mark each with ❌)
2. Spelling mistakes (mark with 📝)
3. Stylistic improvements (mark with ✨)
4. Overall proficiency assessment (A1-C2)

Text:
${text}

Provide detailed, constructive feedback in markdown format.`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();
    
    res.json({ analysis });
    
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});
```

### AI Prompt Engineering

**Prompt Structure:**
```
Role: "You are a German language teacher analyzing student writing."

Tasks:
1. Grammar errors → ❌ marker
2. Spelling mistakes → 📝 marker
3. Stylistic improvements → ✨ marker
4. Proficiency level → A1-C2 scale

Format: Markdown with clear sections

Example Output:
---
## Grammar Analysis

❌ **Line 2:** "Ich habe gehen" → "Ich bin gegangen"
   - Error: Wrong auxiliary verb (haben vs. sein)
   - Rule: Verbs of movement use "sein"

📝 **Line 5:** "Freundinen" → "Freundinnen"
   - Spelling: Double 'n' required

✨ **Line 8:** "sehr gut" → "ausgezeichnet"
   - Style: More advanced vocabulary

## Overall Assessment
Level: B1 (Intermediate)
Strengths: Good sentence structure, varied vocabulary
Areas for improvement: Verb conjugation, case system
---
```

### Rate Limiting

```javascript
// geminiApi.js
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 1000; // 1 second between calls

export const callBackendAI = async (text, endpoint) => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_CALL_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_CALL_INTERVAL - timeSinceLastCall)
    );
  }
  
  lastCallTime = Date.now();
  
  // Make API call...
};
```

### Error Handling

```javascript
// Display user-friendly errors
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
      <span className="text-red-800">{error}</span>
    </div>
  </div>
)}
```

**Common Errors:**
- Empty text → "Please enter text to analyze"
- Text too long → "Text exceeds 5000 character limit"
- API failure → "AI service unavailable. Please try again."
- Network error → "Connection failed. Check your internet."

### Activity Tracking

```javascript
// Records XP and maintains streak
await recordActivity('text_analysis', 1);

// Database update:
// - xp_points += 5 (per analysis)
// - last_activity_date = today
// - current_streak += 1 (if first activity today)
```

---

## AI Language Tutor

**File:** GermanTutor.jsx

### Purpose
Interactive conversational AI tutor powered by Google Gemini 2.5 Flash. Provides real-time German language practice through natural dialogue, grammar explanations, and vocabulary help.

### Component Structure

```javascript
export default function GermanTutor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { recordActivity } = useUserStats();
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ...
}
```

### Chat Interface

```javascript
<div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
  {/* Header */}
  <div className="bg-white rounded-t-lg shadow-lg p-4 border-b">
    <h1 className="text-2xl font-bold">AI Language Tutor</h1>
    <p className="text-sm text-gray-600">Practice German conversation</p>
  </div>
  
  {/* Messages Container */}
  <div className="flex-1 bg-white overflow-y-auto p-6 space-y-4">
    {messages.length === 0 && (
      <div className="text-center text-gray-500 mt-20">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>Start a conversation! Ask me anything about German.</p>
      </div>
    )}
    
    {messages.map((msg, index) => (
      <div
        key={index}
        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-4 ${
            msg.role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans">
            {msg.content}
          </pre>
        </div>
      </div>
    ))}
    
    {loading && (
      <div className="flex justify-start">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </div>
        </div>
      </div>
    )}
    
    <div ref={messagesEndRef} />
  </div>
  
  {/* Input Area */}
  <div className="bg-white rounded-b-lg shadow-lg p-4 border-t">
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        placeholder="Type your message..."
        className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      />
      <Button
        onClick={handleSend}
        disabled={!input.trim() || loading}
        className="px-6"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  </div>
</div>
```

### Message Handling

```javascript
const handleSend = async () => {
  if (!input.trim() || loading) return;
  
  const userMessage = input.trim();
  setInput('');
  
  // Add user message to chat
  setMessages(prev => [...prev, {
    role: 'user',
    content: userMessage
  }]);
  
  setLoading(true);
  
  try {
    // Build conversation context
    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Add current message
    conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });
    
    // Call backend tutor endpoint
    const response = await geminiApi.callBackendAI(
      JSON.stringify({ messages: conversationHistory }),
      'tutor-chat'
    );
    
    // Add AI response to chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response
    }]);
    
    // Record activity
    await recordActivity('tutor_messages', 1);
    
  } catch (error) {
    console.error('Tutor error:', error);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.'
    }]);
  } finally {
    setLoading(false);
  }
};
```

### Backend Tutor Configuration

**Route:** ai.js

```javascript
router.post('/tutor-chat', authenticateUser, async (req, res) => {
  const { messages } = req.body;
  
  try {
    // System prompt for tutor personality
    const systemPrompt = `You are a friendly, patient German language tutor named "Intuu Tutor".

Your role:
- Help users practice German conversation
- Explain grammar rules clearly with examples
- Correct mistakes gently and constructively
- Provide vocabulary suggestions
- Adapt to the user's proficiency level (A1-C2)

Guidelines:
- Always be encouraging and positive
- Use simple language for beginners
- Provide German examples with English translations
- Break down complex concepts into steps
- Celebrate progress and learning moments

Conversation style:
- Casual but professional
- Use emojis occasionally for warmth
- Ask follow-up questions to keep engagement
- Suggest practice exercises when appropriate`;

    // Create chat session with history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        ...messages
      ]
    });
    
    // Get response
    const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
    const response = result.response.text();
    
    res.json({ response });
    
  } catch (error) {
    console.error('Tutor chat error:', error);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});
```

### Conversation Examples

**Beginner (A1) Interaction:**
```
User: "How do I say 'I am happy' in German?"

Tutor: "Great question! 😊

In German, you say: **Ich bin glücklich**

Let's break it down:
- **Ich** = I
- **bin** = am
- **glücklich** = happy

Example sentences:
- Ich bin glücklich. (I am happy.)
- Du bist glücklich. (You are happy.)
- Er ist glücklich. (He is happy.)

Want to practice more emotions? Try asking: 'How do I say I am sad?'"
```

**Intermediate (B1) Interaction:**
```
User: "Ich habe gestern im Park gegangen."

Tutor: "Good effort! 🌟 I can see you're using the perfect tense, but there's a small error.

❌ Ich habe gestern im Park gegangen.
✅ Ich bin gestern im Park gegangen.

The issue: **Verbs of movement use 'sein' (not 'haben').**

Rule: Motion verbs like 'gehen', 'fahren', 'laufen' need 'sein' as auxiliary verb.

Examples:
- Ich bin gegangen (I went)
- Ich bin gefahren (I drove)
- Ich bin gelaufen (I ran)

But:
- Ich habe gespielt (I played) ← 'haben' because no movement

Does this make sense?"
```

**Advanced (C1) Interaction:**
```
User: "Could you explain the difference between 'als' and 'wenn'?"

Tutor: "Excellent question! This is a nuanced topic. 📚

**'Als'** = when (for one-time past events)
**'Wenn'** = when/if/whenever (for repeated events or present/future)

Key differences:

1. **Past, one-time:**
   - Als ich jung war... (When I was young...) ✅
   - Wenn ich jung war... ❌

2. **Past, repeated:**
   - Wenn ich Zeit hatte, las ich. (Whenever I had time, I read.) ✅
   - Als ich Zeit hatte, las ich. ❌ (implies only once)

3. **Present/Future:**
   - Wenn ich Zeit habe... (When/If I have time...) ✅
   - Als ich Zeit habe... ❌

4. **Conditional:**
   - Wenn es regnet... (If it rains...) ✅
   - Als es regnet... ❌

Memory trick: 'als' = 'once upon a time' (single past event)

Want me to give you a practice exercise?"
```

### Activity Tracking

```javascript
// Each message sent counts as activity
await recordActivity('tutor_messages', 1);

// XP earned: 3 XP per message
// Tracks: tutor_messages_total in database
```

---

## E-Book Reader System

**Files:**
- EbookLibrary.jsx - Library grid
- EbookReader.jsx - Reading interface
- ImportEbook.jsx - File upload
- TranslationPopover.jsx - Translation modal
- ebookApi.js - API functions

### Purpose
PDF/TXT e-book reader with instant word translations using DeepL API. Users import books, read with pagination, select words for translation, and track reading progress.

### Library View

```javascript
// EbookLibrary.jsx
export default function EbookLibrary() {
  const [books, setBooks] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    loadBooks();
  }, []);
  
  const loadBooks = async () => {
    const userBooks = await ebookApi.getUserBooks(user.id);
    setBooks(userBooks);
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My E-Books</h1>
        <Button onClick={() => setShowImportModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Import Book
        </Button>
      </div>
      
      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map(book => (
          <div
            key={book.id}
            onClick={() => navigate(`/ebooks/${book.id}`)}
            className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{book.title}</h3>
              <p className="text-sm text-gray-600">{book.author || 'Unknown Author'}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {book.language?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {book.total_pages || '?'} pages
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showImportModal && (
        <ImportEbook
          onClose={() => setShowImportModal(false)}
          onImport={() => {
            loadBooks();
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}
```

### File Import Flow

```javascript
// ImportEbook.jsx
export default function ImportEbook({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('de');
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload PDF or TXT files only');
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(selectedFile);
    
    // Auto-fill title from filename
    if (!title) {
      const filename = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(filename);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !title.trim()) {
      alert('Please select a file and enter a title');
      return;
    }
    
    setUploading(true);
    
    try {
      // Parse file content
      const content = await ebookApi.parseEbook(file);
      
      // Upload to Supabase
      const book = await ebookApi.uploadBook({
        user_id: user.id,
        title: title.trim(),
        author: author.trim() || 'Unknown',
        language,
        content,
        file_size: file.size,
        file_type: file.type,
        total_pages: Math.ceil(content.length / 2000) // Estimate pages
      });
      
      onImport(book);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload book. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Import E-Book</h2>
        
        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select File (PDF or TXT)
          </label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileSelect}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Book title"
          />
        </div>
        
        {/* Author Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Author name (optional)"
          />
        </div>
        
        {/* Language Select */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="de">German</option>
            <option value="en">English</option>
            <option value="tr">Turkish</option>
          </select>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            className="flex-1"
            disabled={!file || !title.trim() || uploading}
          >
            {uploading ? 'Uploading...' : 'Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### PDF Parsing

```javascript
// ebookApi.js
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseEbook = async (file) => {
  if (file.type === 'text/plain') {
    // Parse TXT file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  
  if (file.type === 'application/pdf') {
    // Parse PDF file
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        let isFirstLine = true;
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
          
          // Mark first line as heading (### for markdown)
          const lines = pageText.split('\n');
          lines.forEach((line, index) => {
            const lineText = line.trim();
            if (lineText.length > 0) {
              if (isFirstLine && lineText.length > 5) {
                fullText += '### ' + lineText + '\n';
                isFirstLine = false;
              } else {
                fullText += lineText + '\n';
              }
            }
          });
          
          fullText += '\n---\n\n'; // Page separator
        }
        
        resolve(fullText);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  throw new Error('Unsupported file type');
};
```

### Reading Interface

```javascript
// EbookReader.jsx
export default function EbookReader() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationPosition, setTranslationPosition] = useState({ x: 0, y: 0 });
  
  const CHARS_PER_PAGE = 2000; // ~1 page of text
  
  useEffect(() => {
    loadBook();
  }, [bookId]);
  
  const loadBook = async () => {
    const bookData = await ebookApi.getBook(bookId);
    setBook(bookData);
  };
  
  // Paginate content
  const totalPages = Math.ceil((book?.content?.length || 0) / CHARS_PER_PAGE);
  const startIndex = currentPage * CHARS_PER_PAGE;
  const endIndex = startIndex + CHARS_PER_PAGE;
  const pageContent = book?.content?.substring(startIndex, endIndex) || '';
  
  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0 && text.length < 50) {
      setSelectedText(text);
      setShowTranslation(true);
      
      // Position modal at center of screen
      setTranslationPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      });
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 text-center mb-2">
            {book?.title}
          </h1>
          <p className="text-gray-600">{book?.author}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/ebooks')}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Library
        </Button>
      </div>
      
      {/* Reading Area */}
      <div
        onMouseUp={handleTextSelection}
        className="bg-white rounded-lg shadow-lg p-8 min-h-[600px] mb-6"
      >
        <div className="prose prose-sm max-w-none">
          {pageContent.split('\n').map((paragraph, index) => {
            // Detect headings (marked with ###)
            if (paragraph.startsWith('###')) {
              return (
                <h1
                  key={index}
                  className="text-4xl font-bold text-blue-600 text-center mb-8"
                >
                  {paragraph.replace('###', '').trim()}
                </h1>
              );
            }
            
            // Regular paragraphs
            return paragraph.trim() ? (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ) : null;
          })}
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          variant="secondary"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Previous
        </Button>
        
        <span className="text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        <Button
          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          disabled={currentPage >= totalPages - 1}
          variant="secondary"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
      
      {/* Translation Modal */}
      {showTranslation && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowTranslation(false)}
          />
          
          {/* Translation Popover */}
          <TranslationPopover
            word={selectedText}
            sourceLang={book.language}
            targetLang="en"
            onClose={() => setShowTranslation(false)}
          />
        </>
      )}
    </div>
  );
}
```

### Translation System

```javascript
// TranslationPopover.jsx
export default function TranslationPopover({ word, sourceLang, targetLang, onClose }) {
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTargetLang, setSelectedTargetLang] = useState(targetLang);
  
  useEffect(() => {
    fetchTranslation();
  }, [word, selectedTargetLang]);
  
  const fetchTranslation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await ebookApi.translateText(
        word,
        sourceLang,
        selectedTargetLang
      );
      setTranslation(result);
    } catch (err) {
      setError('Translation failed');
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-96"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Translation</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Original Text */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="text-xs text-gray-600 mb-1">Original ({sourceLang.toUpperCase()})</div>
        <div className="font-semibold">{word}</div>
      </div>
      
      {/* Language Selector */}
      <div className="mb-4">
        <label className="text-xs text-gray-600 block mb-2">Translate to:</label>
        <select
          value={selectedTargetLang}
          onChange={(e) => setSelectedTargetLang(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="en">English</option>
          <option value="tr">Turkish</option>
          <option value="de">German</option>
        </select>
      </div>
      
      {/* Translation Result */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      
      {error && (
        <div className="text-red-600 text-center py-4">{error}</div>
      )}
      
      {!loading && !error && translation && (
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-xs text-blue-600 mb-1">
            Translation ({selectedTargetLang.toUpperCase()})
          </div>
          <div className="font-semibold text-blue-900">{translation}</div>
        </div>
      )}
    </div>
  );
}
```

### DeepL API Integration

**Backend Route:** ebooks.js

```javascript
const deepl = require('deepl-node');
const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

router.post('/translate', authenticateUser, async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;
  
  // Validation
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (text.length > 500) {
    return res.status(400).json({ error: 'Text too long (max 500 characters)' });
  }
  
  try {
    // Map language codes (DeepL requires specific variants)
    const deepLSourceLang = sourceLang === 'en' ? 'en' : sourceLang;
    const deepLTargetLang = targetLang === 'en' ? 'en-US' : 
                           targetLang === 'pt' ? 'pt-BR' : 
                           targetLang;
    
    // Call DeepL API
    const result = await translator.translateText(
      text,
      deepLSourceLang,
      deepLTargetLang
    );
    
    res.json({ translation: result.text });
    
  } catch (error) {
    console.error('DeepL error:', error);
    res.status(500).json({ error: 'Translation service unavailable' });
  }
});
```

**Frontend API:**
```javascript
// ebookApi.js
export const translateText = async (text, sourceLang, targetLang) => {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
    },
    body: JSON.stringify({ text, sourceLang, targetLang })
  });
  
  if (!response.ok) {
    throw new Error('Translation failed');
  }
  
  const data = await response.json();
  return data.translation;
};
```

### Database Schema

```sql
CREATE TABLE user_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  total_pages INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- RLS Policy
  CONSTRAINT books_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books"
  ON user_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON user_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON user_books FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Settings Management

**File:** Settings.jsx

### Purpose
Comprehensive user account management interface with profile updates, password changes, weekly goal configuration, and account statistics.

### Component Structure

```javascript
export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <ProfileSection />
        <WeeklyGoalsSection />
        <PasswordSection />
        <AccountStatsSection />
        <AccountActionsSection />
      </div>
    </div>
  );
}
```

### Profile Section

```javascript
// ProfileSection.jsx
export default function ProfileSection() {
  const { user, profile, updateProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const handleSave = async () => {
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateProfile({ username: username.trim() });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
      
      {message.text && (
        <MessageAlert type={message.type} message={message.text} />
      )}
      
      <div className="space-y-4">
        // ProfileSection.jsx
export default function ProfileSection() {
  const { user, profile, updateProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const handleSave = async () => {
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateProfile({ username: username.trim() });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
      
      {message.text && (
        <MessageAlert type={message.type} message={message.text} />
      )}
      
      <div className="space-y-4">
    Summarized conversation historyI'll continue the CORE-FEATURES.md from the Profile Section. Here's the continuation:

```markdown
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
}
```

### Weekly Goals Section

```javascript
// WeeklyGoalsSection.jsx
export default function WeeklyGoalsSection() {
  const { stats, setWeeklyGoal } = useUserStats();
  const [goalType, setGoalType] = useState(stats?.weekly_goal_type || 'words_learned');
  const [goalTarget, setGoalTarget] = useState(stats?.weekly_goal_target || 50);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const handleSave = async () => {
    if (goalTarget < 10 || goalTarget > 500) {
      setMessage({ type: 'error', text: 'Goal must be between 10 and 500' });
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await setWeeklyGoal(goalType, goalTarget);
      setMessage({ type: 'success', text: 'Weekly goal updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update goal' });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Weekly Goals</h2>
      
      {message.text && (
        <MessageAlert type={message.type} message={message.text} />
      )}
      
      <div className="space-y-4">
        {/* Goal Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What would you like to track?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setGoalType('words_learned')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                goalType === 'words_learned'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <BookOpen className="h-6 w-6 mb-2 text-blue-600" />
              <div className="font-semibold">Words Learned</div>
              <div className="text-sm text-gray-600">Track vocabulary mastery</div>
            </div>
            
            <div
              onClick={() => setGoalType('text_analyses')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                goalType === 'text_analyses'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <FileText className="h-6 w-6 mb-2 text-blue-600" />
              <div className="font-semibold">Text Analyses</div>
              <div className="text-sm text-gray-600">Track grammar practice</div>
            </div>
          </div>
        </div>
        
        {/* Goal Target Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Target: <span className="text-blue-600 font-bold">{goalTarget}</span>
            {goalType === 'words_learned' ? ' words' : ' analyses'}
          </label>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={goalTarget}
            onChange={(e) => setGoalTarget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>250</span>
            <span>500</span>
          </div>
        </div>
        
        {/* Current Progress */}
        {stats && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">This week's progress</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.weekly_goal_current || 0} / {stats.weekly_goal_target || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((stats.weekly_goal_current || 0) / (stats.weekly_goal_target || 1)) * 100,
                    100
                  )}%`
                }}
              />
            </div>
          </div>
        )}
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Goal Settings'}
        </Button>
      </div>
    </Card>
  );
}
```

**Weekly Goal Logic:**
- Goals reset every Monday at midnight (handled by database trigger)
- Progress tracked in `profiles.weekly_goal_current`
- Two goal types:
  1. `words_learned` - Tracks flashcards mastered (mastery_level = 3)
  2. `text_analyses` - Tracks grammar analysis uses
- Range: 10-500 (adjustable via slider)

### Password Section

```javascript
// PasswordSection.jsx
export default function PasswordSection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    // Password strength validation (12+ chars, complexity)
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError });
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Step 1: Re-authenticate with current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (authError) {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
        return;
      }
      
      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      // Success - clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully' });
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
      console.error('Password change error:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Change Password</h2>
      
      {message.text && (
        <MessageAlert type={message.type} message={message.text} />
      )}
      
      <form onSubmit={handleChangePassword} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 border rounded-lg pr-10"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border rounded-lg pr-10"
              placeholder="Enter new password (12+ chars)"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Must be 12+ characters with 3 of: uppercase, lowercase, numbers, special chars
          </p>
        </div>
        
        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="Confirm new password"
          />
        </div>
        
        <Button
          type="submit"
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Changing Password...' : 'Change Password'}
        </Button>
      </form>
    </Card>
  );
}
```

**Security Features:**
- Requires current password (re-authentication)
- Password strength validation (12+ chars, complexity)
- Show/hide password toggles
- Common password blacklist check
- Error messages don't reveal if email exists

### Account Stats Section

```javascript
// AccountStatsSection.jsx
export default function AccountStatsSection() {
  const { stats, loading } = useUserStats();
  
  if (loading) {
    return (
      <Card>
        <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }
  
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* XP Points */}
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">XP Points</span>
          </div>
          <div className="text-3xl font-bold text-yellow-700">
            {stats?.xp_points || 0}
          </div>
        </div>
        
        {/* Current Streak */}
        <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Day Streak</span>
          </div>
          <div className="text-3xl font-bold text-orange-700">
            {stats?.current_streak || 0}
          </div>
        </div>
        
        {/* Words Mastered */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Words Mastered</span>
          </div>
          <div className="text-3xl font-bold text-green-700">
            {stats?.words_mastered || 0}
          </div>
        </div>
        
        {/* Last Study Date */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Last Study</span>
          </div>
          <div className="text-sm font-semibold text-blue-700">
            {stats?.last_study_date 
              ? new Date(stats.last_study_date).toLocaleDateString()
              : 'Never'
            }
          </div>
        </div>
      </div>
      
      {/* Membership Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Free Plan</span>
            </div>
            <p className="text-sm text-gray-600">
              Member since {new Date(stats?.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

### Account Actions Section

```javascript
// AccountActionsSection.jsx
export default function AccountActionsSection() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  const handleDeleteAccount = async () => {
    // Validation
    if (confirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Type DELETE to confirm' });
      return;
    }
    
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Password required' });
      return;
    }
    
    setDeleting(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Step 1: Re-authenticate
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });
      
      if (authError) {
        setMessage({ type: 'error', text: 'Password incorrect' });
        return;
      }
      
      // Step 2: Call database function to delete user
      const { error } = await supabase.rpc('delete_user');
      
      if (error) throw error;
      
      // Step 3: Clear local storage and redirect
      localStorage.clear();
      window.location.href = '/login';
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account' });
      console.error('Delete account error:', error);
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
      
      <div className="space-y-3">
        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="secondary"
          className="w-full justify-center"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </Button>
        
        {/* Delete Account Button */}
        <Button
          onClick={() => setShowDeleteModal(true)}
          variant="danger"
          className="w-full justify-center"
        >
          <Trash2 className="h-5 w-5 mr-2" />
          Delete Account
        </Button>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              Delete Account?
            </h3>
            
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <strong>Warning:</strong> This action is permanent and will delete:
              <ul className="list-disc ml-5 mt-2">
                <li>Your profile and all statistics</li>
                <li>All flashcard decks and cards</li>
                <li>All e-books and progress</li>
                <li>All learning activity history</li>
              </ul>
            </div>
            
            {message.text && (
              <MessageAlert type={message.type} message={message.text} />
            )}
            
            {/* Password Confirmation */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="Password"
              />
            </div>
            
            {/* Type DELETE Confirmation */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="DELETE"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="secondary"
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="danger"
                className="flex-1"
                disabled={deleting || confirmText !== 'DELETE'}
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
```

**Delete Account Security:**
1. Requires password re-authentication
2. Must type "DELETE" to confirm (prevents accidental deletion)
3. Shows comprehensive warning of what will be deleted
4. Uses database function with CASCADE DELETE
5. Clears localStorage and redirects to login

**Database Function:**
```sql
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
```

---

## Statistics Pages

**File:** [`src/components/features/stats/LearningLevel.jsx`](src/components/features/stats/LearningLevel.jsx "src/components/features/stats/LearningLevel.jsx")

### Purpose
Comprehensive statistics dashboard with interactive charts showing learning progress, activity history, and goal completion using Recharts library.

### Component Structure

```javascript
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LearningLevel() {
  const { stats, learningLevel, weeklyGoalProgress, loading } = useUserStats();
  const [activityData, setActivityData] = useState([]);
  const { user } = useAuth();
  
  useEffect(() => {
    loadActivityHistory();
  }, [user]);
  
  const loadActivityHistory = async () => {
    const history = await userStatsApi.getActivityHistory(user.id, 30); // Last 30 days
    setActivityData(history);
  };
  
  // ... charts
}
```

### Learning Level Chart

```javascript
<Card className="mb-6">
  <h2 className="text-2xl font-bold mb-4">Learning Level Progress</h2>
  
  {/* Current Level Badge */}
  <div className="flex items-center justify-center mb-6">
    <div className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
      <div className="text-sm font-medium mb-1">Current Level</div>
      <div className="text-4xl font-bold">
        {learningLevel?.level || 'A1'} {learningLevel?.label || 'Beginner'}
      </div>
    </div>
  </div>
  
  {/* Progress to Next Level */}
  <div className="mb-6">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">
        Progress to {getNextLevel(learningLevel?.level)}
      </span>
      <span className="text-sm font-semibold text-blue-600">
        {stats?.words_mastered || 0} / {getNextLevelThreshold(learningLevel?.level)}
      </span>
    </div>
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
        style={{ width: `${calculateProgressPercentage()}%` }}
      />
    </div>
  </div>
  
  {/* Level Breakdown Bar Chart */}
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={levelData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="level" />
      <YAxis />
      <Tooltip 
        contentStyle={{
          backgroundColor: '#1f2937',
          border: 'none',
          borderRadius: '8px',
          color: '#fff'
        }}
      />
      <Legend />
      <Bar dataKey="required" name="Required Words" fill="#e5e7eb" />
      <Bar dataKey="mastered" name="Your Progress" fill="#3b82f6" />
    </BarChart>
  </ResponsiveContainer>
</Card>
```

**Level Data Calculation:**
```javascript
const levelData = [
  { level: 'A1', required: 100, mastered: Math.min(stats.words_mastered, 100) },
  { level: 'A2', required: 200, mastered: Math.max(0, Math.min(stats.words_mastered - 100, 200)) },
  { level: 'B1', required: 300, mastered: Math.max(0, Math.min(stats.words_mastered - 300, 300)) },
  { level: 'B2', required: 400, mastered: Math.max(0, Math.min(stats.words_mastered - 600, 400)) },
  { level: 'C1', required: 400, mastered: Math.max(0, Math.min(stats.words_mastered - 1000, 400)) },
  { level: 'C2', required: Infinity, mastered: Math.max(0, stats.words_mastered - 2000) }
];
```

### Activity History Chart

```javascript
<Card className="mb-6">
  <h2 className="text-2xl font-bold mb-4">30-Day Activity History</h2>
  
  {/* Line Chart: Words Learned Over Time */}
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={activityData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="date" 
        tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
      />
      <YAxis />
      <Tooltip
        contentStyle={{
          backgroundColor: '#1f2937',
          border: 'none',
          borderRadius: '8px',
          color: '#fff'
        }}
        labelFormatter={(date) => new Date(date).toLocaleDateString()}
      />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="words_learned" 
        name="Words Learned"
        stroke="#10b981" 
        strokeWidth={2}
        dot={{ fill: '#10b981', r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
  
  {/* Multi-Bar Chart: All Activities */}
  <ResponsiveContainer width="100%" height={300} className="mt-8">
    <BarChart data={activityData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="date"
        tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
      />
      <YAxis />
      <Tooltip
        contentStyle={{
          backgroundColor: '#1f2937',
          border: 'none',
          borderRadius: '8px',
          color: '#fff'
        }}
      />
      <Legend />
      <Bar dataKey="words_learned" name="Words" fill="#10b981" />
      <Bar dataKey="flashcard_reviews" name="Flashcards" fill="#6366f1" />
      <Bar dataKey="text_analyses" name="Text Analysis" fill="#f59e0b" />
      <Bar dataKey="tutor_messages" name="Tutor" fill="#ec4899" />
    </BarChart>
  </ResponsiveContainer>
</Card>
```

**Activity Data Structure:**
```javascript
// Example activityData from API
[
  {
    date: '2025-12-18',
    words_learned: 5,
    flashcard_reviews: 25,
    text_analyses: 2,
    tutor_messages: 8
  },
  {
    date: '2025-12-17',
    words_learned: 3,
    flashcard_reviews: 18,
    text_analyses: 1,
    tutor_messages: 5
  },
  // ... 28 more days
]
```

### Weekly Goal Pie Chart

```javascript
<Card>
  <h2 className="text-2xl font-bold mb-4">Weekly Goal Progress</h2>
  
  <div className="flex items-center justify-center mb-6">
    <div className="text-center">
      <div className="text-6xl font-bold text-blue-600">
        {Math.round(weeklyGoalProgress)}%
      </div>
      <div className="text-gray-600 mt-2">Complete</div>
    </div>
  </div>
  
  {/* Donut Chart */}
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={[
          { name: 'Completed', value: stats.weekly_goal_current || 0 },
          { name: 'Remaining', value: Math.max(0, (stats.weekly_goal_target || 50) - (stats.weekly_goal_current || 0)) }
        ]}
        cx="50%"
        cy="50%"
        innerRadius={80}
        outerRadius={120}
        paddingAngle={5}
        dataKey="value"
      >
        <Cell fill="#3b82f6" />
        <Cell fill="#e5e7eb" />
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
  
  {/* Goal Details */}
  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
    <div className="flex justify-between mb-2">
      <span className="text-gray-700">Goal Type:</span>
      <span className="font-semibold">
        {stats.weekly_goal_type === 'words_learned' ? 'Words Learned' : 'Text Analyses'}
      </span>
    </div>
    <div className="flex justify-between mb-2">
      <span className="text-gray-700">Current Progress:</span>
      <span className="font-semibold text-blue-600">
        {stats.weekly_goal_current || 0}
      </span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-700">Target:</span>
      <span className="font-semibold">{stats.weekly_goal_target || 50}</span>
    </div>
  </div>
  
  {/* Motivational Message */}
  {weeklyGoalProgress >= 100 && (
    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
      <div className="text-green-700 font-semibold mb-1">
        🎉 Goal Achieved!
      </div>
      <div className="text-sm text-green-600">
        Great job! Keep up the amazing work.
      </div>
    </div>
  )}
  
  {weeklyGoalProgress < 100 && weeklyGoalProgress > 0 && (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
      <div className="text-blue-700 font-semibold mb-1">
        Keep Going!
      </div>
      <div className="text-sm text-blue-600">
        You're {Math.round(weeklyGoalProgress)}% of the way there.
      </div>
    </div>
  )}
</Card>
```

---

## Data Flow Summary

### Complete User Journey Example

**Scenario:** User learns 5 German words via flashcards

```
1. User logs in
   ↓
2. AuthContext loads user session from localStorage
   ↓
3. Dashboard component renders
   ↓
4. useUserStats() hook fetches profile data
   ↓
5. User clicks "Flashcards" → DeckSelector modal appears
   ↓
6. User selects "German Verbs" deck
   ↓
7. Cards loaded from database (sorted by next_review_at)
   ↓
8. User studies card "gehen" → clicks "I know this"
   ↓
9. handleAnswer(true) executes:
   - SM-2 algorithm calculates next review: 6 days
   - Updates card.mastery_level: 1 → 2
   - Updates card.times_correct: 2 → 3
   - If mastery_level reaches 3:
     • Inserts into learned_words table
     • Increments profiles.words_mastered
   ↓
10. recordActivity('flashcard_reviews', 1) executes:
    - Inserts into user_activities table
    - Database trigger checks last_study_date
    - If different day: current_streak += 1
    - Updates last_study_date = today
    ↓
11. updateWeeklyGoal(1) executes:
    - Increments weekly_goal_current += 1
    ↓
12. User finishes 5 cards → Returns to Dashboard
    ↓
13. Dashboard refreshes stats:
    - words_mastered: 45 → 50
    - current_streak: 4 → 5 (if first activity today)
    - weekly_goal_current: 10 → 15
    - weeklyGoalProgress: 20% → 30%
    ↓
14. UI updates automatically (React state management)
```

---

## Conclusion

Intuu's core features provide a comprehensive language learning ecosystem:

- **Dashboard** - Motivational hub with real-time stats
- **Flashcards** - Scientific spaced repetition (SM-2)
- **Text Analyzer** - AI-powered grammar feedback
- **Language Tutor** - Conversational AI practice
- **E-Book Reader** - Immersive reading with instant translations
- **Settings** - Complete account management
- **Statistics** - Visual progress tracking with charts

All features are interconnected through:
- Unified user stats tracking
- Consistent authentication
- Activity recording for streaks/XP
- Progress visualization

The system is designed for scalability, maintainability, and optimal user experience.

---

**Last Updated:** December 19, 2025  
**Version:** 1.0.0  
**Maintained By:** Intuu Development Team
```

---

**Save this complete content as `CORE-FEATURES.md` in your documentation folder.**

This completes the core features documentation. Would you like me to proceed with the remaining documentation files (API Reference, Hooks & State, and Complete Components)?---

**Save this complete content as `CORE-FEATURES.md` in your documentation folder.**

This completes the core features documentation. Would you like me to proceed with the remaining documentation files (API Reference, Hooks & State, and Complete Components)?