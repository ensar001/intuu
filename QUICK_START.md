# Quick Start Commands

## 1. Install Dependencies
```bash
npm install @aws-sdk/client-polly
```

## 2. Configure AWS Credentials
Create/update `backend/.env`:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key  # ← REQUIRED for audio caching

# AWS Polly
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
```

**Get Supabase Service Key:**
- Go to Supabase Dashboard → Settings → API
- Copy the `service_role` key (NOT the `anon` key)
- Add to `.env` as `SUPABASE_SERVICE_KEY`

## 3. Run Database Migrations

### A. Run Schema Migration
Copy this SQL to Supabase Dashboard → SQL Editor:
```bash
# Open and copy the contents
cat database/migrations/008_simplify_schema_remove_spaced_repetition.sql
```

### B. Run Audio Storage Migration
Copy this SQL to Supabase Dashboard → SQL Editor:
```bash
# Open and copy the contents
cat database/migrations/009_create_audio_storage.sql
```

Then paste and execute both in Supabase Dashboard SQL Editor.

## 4. Verify Migration
```sql
-- Quick verification queries
SELECT COUNT(*) FROM cards;
SELECT COUNT(*) FROM decks WHERE language IS NOT NULL;
SELECT COUNT(*) FROM learned_words WHERE card_id IS NULL;
```

## 5. Start Application
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## 6. Test Features

### Test Flashcards
1. Navigate to Flashcards
2. Create a deck (select language)
3. Add a card
4. Review: Click "I know this" or "I don't know"
5. Check mastery level increases/resets

### Test TTS
1. Navigate to E-books
2. Open any book
3. Click "Listen" button
4. Audio should play after brief loading
5. Test pause/resume/stop controls

## Troubleshooting Commands

### Check Backend is Running
```bash
curl http://localhost:3001/health
```

### Test TTS Endpoint (requires auth token)
```bash
curl -X POST http://localhost:3001/api/tts/voices?language=de
```

### Check Database Connection
```sql
SELECT version();
SELECT current_database();
```

### View Recent Errors (in Supabase Dashboard)
Go to: Database → Logs → Error Logs

---

## One-Line Setup
```bash
npm install @aws-sdk/client-polly && echo "⚠️ Now add AWS credentials to backend/.env and run migration in Supabase Dashboard"
```

---

## Emergency Rollback
```sql
-- Restore spaced repetition fields
ALTER TABLE cards ADD COLUMN interval INTEGER DEFAULT 1;
ALTER TABLE cards ADD COLUMN ease_factor REAL DEFAULT 2.5;
ALTER TABLE cards ADD COLUMN next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE decks ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE learned_words ADD COLUMN card_id UUID;
```

Then:
```bash
git checkout HEAD~1 -- src/utils/deckApi.js src/components/features/Flashcards.jsx
npm run dev
npm run server
```

---

## Documentation Quick Links
- Full guide: `DATABASE_MIGRATION_GUIDE.md`
- Setup: `INSTALLATION_SETUP.md`
- Summary: `SCHEMA_REFACTORING_SUMMARY.md`
