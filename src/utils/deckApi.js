import { supabase } from './supabaseClient';

export const deckApi = {
  // Get all decks for user
  getDecks: async (userId) => {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('title');
    
    if (error) throw error;
    return data;
  },

  // Create a new deck
  createDeck: async (userId, title, isPublic = false, language = 'de') => {
    const { data, error } = await supabase
      .from('decks')
      .insert([{ user_id: userId, title, is_public: isPublic, language }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update deck
  updateDeck: async (deckId, updates) => {
    const { data, error} = await supabase
      .from('decks')
      .update(updates)
      .eq('id', deckId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete deck
  deleteDeck: async (deckId) => {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId);
    
    if (error) throw error;
  }
};

export const cardApi = {
  // Get all cards in a deck
  getCards: async (deckId) => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('next_review_at');
    
    if (error) throw error;
    return data;
  },

  // Get cards due for review
  getDueCards: async (deckId) => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at');
    
    if (error) throw error;
    return data;
  },

  // Create a new card
  createCard: async (deckId, frontText, backText, audioUrl = null) => {
    const { data, error } = await supabase
      .from('cards')
      .insert([{
        deck_id: deckId,
        front_text: frontText,
        back_text: backText,
        audio_url: audioUrl
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update card (for spaced repetition)
  updateCard: async (cardId, updates) => {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', cardId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete card
  deleteCard: async (cardId) => {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);
    
    if (error) throw error;
  },

  // Calculate next review based on spaced repetition (SM-2 Algorithm)
  calculateNextReview: (quality, currentInterval, currentEaseFactor) => {
    // quality: 0-5 (0 = complete blackout, 5 = perfect response)
    let newInterval;
    let newEaseFactor = currentEaseFactor;

    if (quality < 3) {
      // Failed - restart interval
      newInterval = 1;
    } else {
      // Passed
      if (currentInterval === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * currentEaseFactor);
      }

      // Adjust ease factor
      newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      interval: newInterval,
      easeFactor: newEaseFactor,
      nextReviewAt: nextReviewDate.toISOString()
    };
  }
};
