# Intuu - Language Learning Platform

## Getting Started

### Install Dependencies
```bash
npm install
```

### Running the Application

**Terminal 1 - Frontend (Vite Dev Server):**
```bash
npm run dev
```

**Terminal 2 - Backend (Express Server):**
```bash
npm run server
```

The frontend will run on `http://localhost:5173` and the backend on `http://localhost:3001`.

### API Endpoints

**Flashcards API:**
- `GET /api/flashcards` - Get all flashcards
- `GET /api/flashcards/:id` - Get single flashcard
- `POST /api/flashcards` - Create new flashcard
- `PUT /api/flashcards/:id` - Update flashcard
- `POST /api/flashcards/:id/review` - Record review (correct/incorrect)
- `DELETE /api/flashcards/:id` - Delete flashcard

### Environment Variables

Create a `.env` file in the root directory:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

## Project Structure

```
intuu/
├── backend/
│   ├── server.js           # Express server
│   └── data/
│       └── flashcards.json # Flashcard storage
├── src/
│   ├── components/
│   ├── utils/
│   │   ├── geminiApi.js
│   │   └── flashcardApi.js # Backend API client
│   └── ...
└── ...
```

## Features

- 🎯 Dashboard with stats tracking
- 📝 Text Analyzer with AI corrections
- 💬 Language Tutor chatbot
- 🎴 Flashcards with backend storage
- 📚 E-book Reader with on-click translation and TTS features
- 📊 Statistics tracking
- 🌍 Multi-language support (English/German)
- 🚀 Interface language selection (Turkish/German/English)
