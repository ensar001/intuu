import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Lock, ChevronRight, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { deckApi } from '../../utils/deckApi';
import { useAuth } from '../../contexts/AuthContext';

export default function DeckSelector({ onSelectDeck, onClose, language = 'de', onReviewMode }) {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDecks();
  }, [language]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const data = await deckApi.getDecks(user.id);
      // Filter decks by language
      const filteredDecks = data.filter(deck => 
        !deck.language || deck.language === language
      );
      setDecks(filteredDecks);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load decks:', err);
      }
      setError('Failed to load decks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    
    if (!newDeckTitle.trim()) {
      setError('Deck title is required');
      return;
    }

    try {
      setCreating(true);
      setError('');
      const newDeck = await deckApi.createDeck(user.id, newDeckTitle.trim(), language);
      setDecks([...decks, newDeck]);
      setNewDeckTitle('');
      setShowCreateForm(false);
      onSelectDeck(newDeck);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to create deck:', err);
      }
      setError('Failed to create deck');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDeck = async (deckId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this deck? All cards will be removed.')) {
      return;
    }

    try {
      await deckApi.deleteDeck(deckId);
      setDecks(decks.filter(d => d.id !== deckId));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete deck:', err);
      }
      setError('Failed to delete deck');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading decks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Select a Deck</h2>
            <p className="text-slate-600 mt-1">Choose a deck to study or create a new one</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!showCreateForm ? (
          <>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              className="w-full mb-4 justify-center"
            >
              <Plus className="w-5 h-5" />
              Create New Deck
            </Button>

            {decks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg mb-2">No decks yet</p>
                <p className="text-sm">Create your first deck to start learning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {decks.map((deck) => (
                  <div
                    key={deck.id}
                    className="group p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => onSelectDeck(deck, false)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 group-hover:text-primary-600">
                            {deck.title}
                          </h3>
                          {deck.is_public ? (
                            <Globe className="w-4 h-4 text-green-600" title="Public deck" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400" title="Private deck" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          Created {new Date(deck.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeck(deck, true);
                          }}
                          className="px-3 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                          title="Review with spaced repetition"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Review
                        </button>
                        <button
                          onClick={(e) => handleDeleteDeck(deck.id, e)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete deck"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors cursor-pointer" onClick={() => onSelectDeck(deck, false)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleCreateDeck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deck Title
              </label>
              <input
                type="text"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                placeholder="e.g., German Vocabulary, Business English..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={creating}
                autoFocus
              />
            </div>


            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                className="flex-1 justify-center"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Deck'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDeckTitle('');
                  setNewDeckPublic(false);
                  setError('');
                }}
                variant="secondary"
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
