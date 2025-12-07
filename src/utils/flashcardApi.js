const API_BASE_URL = 'http://localhost:3001/api';

export const flashcardAPI = {
  // Get all flashcards for a language
  async getAll(language = 'de') {
    const response = await fetch(`${API_BASE_URL}/flashcards?language=${language}`);
    if (!response.ok) throw new Error('Failed to fetch flashcards');
    return response.json();
  },

  // Get single flashcard
  async getById(id, language = 'de') {
    const response = await fetch(`${API_BASE_URL}/flashcards/${id}?language=${language}`);
    if (!response.ok) throw new Error('Failed to fetch flashcard');
    return response.json();
  },

  // Create new flashcard
  async create(flashcard) {
    const response = await fetch(`${API_BASE_URL}/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flashcard),
    });
    if (!response.ok) throw new Error('Failed to create flashcard');
    return response.json();
  },

  // Update flashcard
  async update(id, flashcard) {
    const language = flashcard.language || 'de';
    const response = await fetch(`${API_BASE_URL}/flashcards/${id}?language=${language}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flashcard),
    });
    if (!response.ok) throw new Error('Failed to update flashcard');
    return response.json();
  },

  // Record review
  async recordReview(id, correct, language = 'de') {
    const response = await fetch(`${API_BASE_URL}/flashcards/${id}/review?language=${language}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct }),
    });
    if (!response.ok) throw new Error('Failed to record review');
    return response.json();
  },

  // Delete flashcard
  async delete(id, language = 'de') {
    const response = await fetch(`${API_BASE_URL}/flashcards/${id}?language=${language}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete flashcard');
    return response.json();
  },
};
