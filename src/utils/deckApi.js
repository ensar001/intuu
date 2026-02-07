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
  createDeck: async (userId, title, language = 'de') => {
    const { data, error } = await supabase
      .from('decks')
      .insert([{ user_id: userId, title, language }])
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
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  // Create a new card
  createCard: async (deckId, frontText, backText, audioUrl = null) => {
    const payload = {
      deck_id: deckId,
      front_text: frontText,
      back_text: backText,
      ...(audioUrl ? { audio_url: audioUrl } : {})
    };

    const { data, error } = await supabase
      .from('cards')
      .insert([payload])
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
  }
};
