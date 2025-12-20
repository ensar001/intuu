# Installation & Setup Instructions

## 1. Install AWS Polly SDK

The AWS SDK for Polly TTS functionality needs to be added to your project:

```bash
npm install @aws-sdk/client-polly
```

## 2. Update Package.json

Your `package.json` should include:

```json
{
  "dependencies": {
    "@aws-sdk/client-polly": "^3.0.0",
    "@supabase/supabase-js": "^2.87.0",
    "cors": "^2.8.5",
    "deepl-node": "^1.24.0",
    "dotenv": "^17.2.3",
    "express": "^4.18.2",
    "lucide-react": "^0.454.0",
    "pdfjs-dist": "^5.4.449",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^6.28.0",
    "recharts": "^3.5.1"
  }
}
```

## 3. Configure Environment Variables

Create or update `backend/.env`:

```env
# Existing Supabase config
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Existing API keys
DEEPL_API_KEY=your_deepl_key
GEMINI_API_KEY=your_gemini_key

# NEW: AWS Polly Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Server config
PORT=3001
NODE_ENV=development
```

## 4. AWS IAM Setup

### Create IAM User for Polly

1. **Go to AWS Console** → IAM → Users
2. **Create User:**
   - User name: `intuu-polly-tts`
   - Access type: Programmatic access
3. **Attach Policy:**
   - Search for: `AmazonPollyReadOnlyAccess`
   - Or create custom policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "polly:SynthesizeSpeech"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
4. **Create Access Key:**
   - Application type: "Application running outside AWS"
   - Copy Access Key ID and Secret Access Key
5. **Add to `.env`:**
   ```env
   AWS_ACCESS_KEY_ID=AKIA...your_key
   AWS_SECRET_ACCESS_KEY=abc123...your_secret
   ```

### AWS Free Tier
- **Neural voices:** 5 million characters per month (first 12 months)
- **Standard voices:** 5 million characters per month (first 12 months)
- After free tier: $16/million chars (neural), $4/million chars (standard)

## 5. Run Database Migration

### Option A: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push database/migrations/008_simplify_schema_remove_spaced_repetition.sql
```

### Option B: Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Open file: `database/migrations/008_simplify_schema_remove_spaced_repetition.sql`
5. Copy entire contents
6. Paste into SQL Editor
7. Click **Run**

### Option C: Direct SQL
If you have direct database access:
```bash
psql postgresql://user:password@host:port/database -f database/migrations/008_simplify_schema_remove_spaced_repetition.sql
```

## 6. Verify Migration

Run this SQL to verify changes:

```sql
-- Check cards table (should NOT have interval, ease_factor, next_review_at)
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cards';

-- Check decks have language field
SELECT id, title, language FROM decks LIMIT 3;

-- Check learned_words (should NOT have card_id)
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'learned_words';

-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE indexname IN ('idx_cards_deck_mastery', 'idx_decks_user_language');
```

## 7. Start the Application

```bash
# Install dependencies (if not already done)
npm install

# Start frontend dev server
npm run dev

# In another terminal, start backend server
npm run server
```

## 8. Test TTS Functionality

1. **Navigate to E-books** in the app
2. **Open any book**
3. **Click "Listen" button** in the header
4. **Wait for synthesis** (loading indicator appears)
5. **Audio should play automatically**
6. **Test pause/resume and stop buttons**

### Troubleshooting TTS

**Issue: "Failed to generate speech: 403"**
- Check AWS credentials in `.env`
- Verify IAM user has `polly:SynthesizeSpeech` permission
- Check AWS region is correct (default: `us-east-1`)

**Issue: "Failed to generate speech: Invalid parameters"**
- Text might be too long (600 chars for neural, 3000 for standard)
- Use `/api/tts/synthesize-chunked` endpoint for long text (already implemented in frontend)

**Issue: Audio doesn't play**
- Check browser console for errors
- Verify user authentication (TTS requires auth token)
- Test backend endpoint directly:
  ```bash
  curl -X POST http://localhost:3001/api/tts/synthesize \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"text": "Hello world", "language": "en"}'
  ```

**Issue: Backend not starting**
- Make sure port 3001 is not in use
- Check `backend/server.js` imports TTS routes correctly
- Verify `backend/routes/tts.js` exists

## 9. Test Flashcard Changes

1. **Create a new deck** (should now require language selection)
2. **Add cards to the deck**
3. **Review cards:**
   - Click "I know this" → mastery increases
   - Click "I don't know" → mastery resets to 0
4. **Check learned words:**
   ```sql
   SELECT word, language, mastery_level, times_reviewed 
   FROM learned_words 
   WHERE user_id = 'your_user_id';
   ```

## 10. Performance Verification

After migration, these queries should be faster:

```sql
-- Deck listing (should use idx_decks_user_language)
EXPLAIN ANALYZE 
SELECT * FROM decks WHERE user_id = 'user_id' AND language = 'de';

-- Card loading (should use idx_cards_deck_mastery)
EXPLAIN ANALYZE
SELECT * FROM cards WHERE deck_id = 'deck_id' ORDER BY mastery_level;

-- Learned words (should use new unique index)
EXPLAIN ANALYZE
SELECT * FROM learned_words 
WHERE user_id = 'user_id' AND word = 'der Tisch' AND language = 'de';
```

Look for "Index Scan" in the query plan (not "Seq Scan").

## 11. Monitoring & Maintenance

### AWS Polly Usage Monitoring

**CloudWatch:**
1. Go to AWS CloudWatch
2. Search for "Polly"
3. Monitor metrics:
   - `RequestCharacters` - Total characters synthesized
   - `ResponseTime` - API latency
   - `4xx/5xx Errors` - Failed requests

**Cost Alerts:**
1. Go to AWS Billing Console
2. Create Budget Alert
3. Set threshold (e.g., $10/month)
4. Get email when 80% reached

### Database Monitoring

**Track query performance:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- View slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Application Logs

**Check for errors:**
```bash
# Backend logs
npm run server 2>&1 | tee backend.log

# Frontend logs (browser console)
# Look for TTS synthesis errors, API failures, auth issues
```

## 12. Rollback Instructions

If issues occur, you can rollback:

### Rollback Database
```sql
-- Re-add removed fields (see DATABASE_MIGRATION_GUIDE.md)
ALTER TABLE cards ADD COLUMN interval INTEGER DEFAULT 1;
ALTER TABLE cards ADD COLUMN ease_factor REAL DEFAULT 2.5;
ALTER TABLE cards ADD COLUMN next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- ... (see full rollback in guide)
```

### Rollback Code
```bash
# Restore previous version from git
git checkout HEAD~1 -- src/utils/deckApi.js
git checkout HEAD~1 -- src/components/features/Flashcards.jsx
git checkout HEAD~1 -- src/hooks/useUserStats.js
git checkout HEAD~1 -- src/utils/userStatsApi.js

# Remove TTS files
git checkout HEAD~1 -- src/components/features/ebooks/EbookReader.jsx
rm backend/routes/tts.js
```

## Quick Start Checklist

- [ ] `npm install @aws-sdk/client-polly`
- [ ] Create AWS IAM user with Polly permissions
- [ ] Add AWS credentials to `backend/.env`
- [ ] Run database migration via Supabase Dashboard
- [ ] Verify migration with test queries
- [ ] Start backend server (`npm run server`)
- [ ] Start frontend (`npm run dev`)
- [ ] Test TTS in e-book reader
- [ ] Test flashcard review flow
- [ ] Check learned_words tracking
- [ ] Monitor AWS CloudWatch for usage

## Support Resources

- **Database Migration Guide:** `DATABASE_MIGRATION_GUIDE.md`
- **AWS Polly Documentation:** https://docs.aws.amazon.com/polly/
- **Supabase Docs:** https://supabase.com/docs
- **Project Issues:** Check browser console and backend logs

## Environment Variables Reference

```env
# === SUPABASE ===
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === TRANSLATION API ===
DEEPL_API_KEY=xxx:fx

# === AI TUTOR ===
GEMINI_API_KEY=AIzaSyXXXXXXXX

# === AWS POLLY TTS ===
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# === SERVER ===
PORT=3001
NODE_ENV=development
```

Replace all placeholder values with your actual credentials.
