-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  xp_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create decks table
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  audio_url TEXT,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interval INTEGER DEFAULT 1,
  ease_factor REAL DEFAULT 2.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_next_review ON cards(next_review_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (allow during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- RLS Policies for decks
-- Users can view their own decks
CREATE POLICY "Users can view own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public decks
CREATE POLICY "Users can view public decks"
  ON decks FOR SELECT
  USING (is_public = true);

-- Users can create their own decks
CREATE POLICY "Users can create own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own decks
CREATE POLICY "Users can update own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own decks
CREATE POLICY "Users can delete own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cards
-- Users can view cards from their own decks
CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

-- Users can view cards from public decks
CREATE POLICY "Users can view public deck cards"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = cards.deck_id 
      AND decks.is_public = true
    )
  );

-- Users can create cards in their own decks
CREATE POLICY "Users can create cards in own decks"
  ON cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

-- Users can update cards in their own decks
CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );

-- Users can delete cards from their own decks
CREATE POLICY "Users can delete own cards"
  ON cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM decks 
      WHERE decks.id = cards.deck_id 
      AND decks.user_id = auth.uid()
    )
  );
