import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import aiRoutes from './routes/ai.js';
import flashcardsRoutes from './routes/flashcards.js';
import ebooksRoutes from './routes/ebooks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client with anon key (same as frontend)
// We'll verify tokens by passing them through, not using service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/ai', aiRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api', ebooksRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
