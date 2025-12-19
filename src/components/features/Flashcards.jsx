import { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Plus, X, Loader2, Trash2, FolderOpen, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import { cardApi } from '../../utils/deckApi';
import { useAuth } from '../../contexts/AuthContext';
import { LANGUAGES } from '../../utils/constants';
import { useTranslation } from '../../utils/translations';
import DeckSelector from './DeckSelector';
import { validateFlashcardContent } from '../../utils/inputValidation';
import { useUserStats } from '../../hooks/useUserStats';
import { GermanFlag, USFlag } from '../ui/flags';

// Card Form Component
const CardForm = ({ onSubmit, onCancel, isSaving, error }) => {
    const [frontText, setFrontText] = useState('');
    const [backText, setBackText] = useState('');
    const [category, setCategory] = useState('');
    const [example, setExample] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(frontText, backText, category, example);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-lg p-6 bg-white rounded-xl shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-slate-800">Create New Card</h4>
                    <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Front (Question)</label>
                    <input
                        type="text"
                        value={frontText}
                        onChange={(e) => setFrontText(e.target.value)}
                        placeholder="e.g., der Tisch"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                        disabled={isSaving}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Back (Answer)</label>
                    <textarea
                        value={backText}
                        onChange={(e) => setBackText(e.target.value)}
                        placeholder="e.g., the table"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows="3"
                        required
                        disabled={isSaving}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category (Optional)</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Noun, Verb, Adjective"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isSaving}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Usage Example (Optional)</label>
                    <textarea
                        value={example}
                        onChange={(e) => setExample(e.target.value)}
                        placeholder="e.g., Der Tisch ist groß. (The table is big.)"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        rows="2"
                        disabled={isSaving}
                    />
                </div>

                <div className="flex gap-2">
                    <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Create
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                </div>
            </div>
        </form>
        </div>
    );
};

const Flashcards = ({ language = 'de', interfaceLanguage = 'en' }) => {
    const { user } = useAuth();
    const { t } = useTranslation(interfaceLanguage);
    const { learnWord, recordActivity, updateWeeklyGoal } = useUserStats();
    const learningLangConfig = LANGUAGES.find(lang => lang.id === language) || LANGUAGES[1];
    const learningLangName = learningLangConfig.name;

    const [currentDeck, setCurrentDeck] = useState(null);
    const [showDeckSelector, setShowDeckSelector] = useState(false);
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showCardForm, setShowCardForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [reviewMode, setReviewMode] = useState(false); // New: review mode flag

    const currentCard = cards[currentIndex];

    useEffect(() => {
        if (!currentDeck) {
            setShowDeckSelector(true);
        } else {
            loadCards();
        }
    }, [currentDeck]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Don't trigger shortcuts if user is typing in a form
            if (showCardForm || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault(); // Prevent page scroll
                    // Mark as correct and next card
                    if (cards.length > 1 && currentCard) {
                        recordReview(true);
                        nextCard();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault(); // Prevent page scroll
                    // Mark as wrong and next card
                    if (cards.length > 1 && currentCard) {
                        recordReview(false);
                        nextCard();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault(); // Prevent page scroll
                    // Next card without review
                    if (cards.length > 1) {
                        nextCard();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault(); // Prevent page scroll
                    // Previous card
                    if (cards.length > 1) {
                        setIsFlipped(false);
                        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 200);
                    }
                    break;
                case ' ':
                case 'Enter':
                    // Flip card
                    e.preventDefault();
                    setIsFlipped(!isFlipped);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [cards, currentCard, isFlipped, showCardForm]);

    const loadCards = async () => {
        if (!currentDeck) return;
        
        setIsLoading(true);
        try {
            const data = await cardApi.getCards(currentDeck.id);
            setCards(data);
            setCurrentIndex(0);
            setReviewMode(false);
        } catch (error) {
            console.error('Failed to load cards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // New: Load cards in spaced repetition order
    const loadReviewMode = async () => {
        if (!currentDeck) return;
        
        setIsLoading(true);
        try {
            const data = await cardApi.getCards(currentDeck.id);
            
            // Sort by spaced repetition algorithm
            // Priority: 1) Don't know (mastery 0), 2) Learning (mastery 1), 3) Familiar (mastery 2), 4) Known (mastery 3)
            // Within each group, sort by next_review_at (due cards first)
            const sortedCards = data.sort((a, b) => {
                // First, sort by mastery level
                if (a.mastery_level !== b.mastery_level) {
                    return a.mastery_level - b.mastery_level;
                }
                // Then by review date (earlier dates first)
                return new Date(a.next_review_at) - new Date(b.next_review_at);
            });
            
            setCards(sortedCards);
            setCurrentIndex(0);
            setReviewMode(true);
        } catch (error) {
            console.error('Failed to load cards for review:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectDeck = (deck, isReviewMode = false) => {
        setCurrentDeck(deck);
        setShowDeckSelector(false);
        
        // Load cards in review mode or normal mode
        if (isReviewMode) {
            setTimeout(() => loadReviewMode(), 100);
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
    };

    const handleCreateCard = async (frontText, backText, category, example) => {
        const frontValidation = validateFlashcardContent(frontText);
        const backValidation = validateFlashcardContent(backText);
        
        if (!frontValidation.valid) {
            setError(`Front: ${frontValidation.error}`);
            return;
        }
        
        if (!backValidation.valid) {
            setError(`Back: ${backValidation.error}`);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Format back text with category and example
            let formattedBackText = backValidation.sanitized;
            if (category) {
                formattedBackText = `[${category}]\n\n${formattedBackText}`;
            }
            if (example) {
                formattedBackText = `${formattedBackText}\n\nExample: ${example}`;
            }

            const newCard = await cardApi.createCard(
                currentDeck.id,
                frontValidation.sanitized,
                formattedBackText
            );
            setCards([...cards, newCard]);
            setShowCardForm(false);
        } catch (error) {
            console.error('Failed to create card:', error);
            setError('Failed to create flashcard. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteCurrentCard = async () => {
        if (!currentCard || !confirm('Are you sure you want to delete this card?')) return;

        try {
            await cardApi.deleteCard(currentCard.id);
            const updatedCards = cards.filter(c => c.id !== currentCard.id);
            setCards(updatedCards);
            setCurrentIndex(updatedCards.length === 0 ? 0 : Math.min(currentIndex, updatedCards.length - 1));
        } catch (error) {
            console.error('Failed to delete card:', error);
            alert('Failed to delete card');
        }
    };

    const recordReview = async (quality) => {
        if (!currentCard) return;
        
        try {
            // Update card mastery and spaced repetition data
            const newMasteryLevel = quality ? Math.min((currentCard.mastery_level || 0) + 1, 3) : 0;
            const timesCorrect = quality ? (currentCard.times_correct || 0) + 1 : currentCard.times_correct || 0;
            const timesIncorrect = !quality ? (currentCard.times_incorrect || 0) + 1 : currentCard.times_incorrect || 0;
            
            // Calculate next review using SM-2 algorithm
            const reviewData = cardApi.calculateNextReview(
                quality ? 4 : 2, // quality 0-5
                currentCard.interval || 1,
                currentCard.ease_factor || 2.5
            );

            await cardApi.updateCard(currentCard.id, {
                mastery_level: newMasteryLevel,
                times_correct: timesCorrect,
                times_incorrect: timesIncorrect,
                next_review_at: reviewData.nextReviewAt,
                interval: reviewData.interval,
                ease_factor: reviewData.easeFactor
            });

            // Track word learning in user stats
            if (quality && user) {
                await learnWord(
                    currentCard.front_text,
                    language,
                    currentCard.id,
                    newMasteryLevel
                );
                
                // Update weekly goal if goal type is words
                await updateWeeklyGoal(1);
                
                // Record flashcard activity
                await recordActivity('flashcard_reviews', 1);
            }

            // Update local card state
            const updatedCards = cards.map(c => 
                c.id === currentCard.id 
                    ? { ...c, mastery_level: newMasteryLevel, times_correct: timesCorrect, times_incorrect: timesIncorrect }
                    : c
            );
            setCards(updatedCards);

        } catch (error) {
            console.error('Failed to record review:', error);
        }
    };

    if (showDeckSelector) {
        return (
            <DeckSelector
                onSelectDeck={handleSelectDeck}
                onClose={() => setShowDeckSelector(false)}
                language={language}
            />
        );
    }

    if (!currentDeck) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Deck Selected</h3>
                    <p className="text-slate-500 mb-4">Select a deck to start studying</p>
                    <Button onClick={() => setShowDeckSelector(true)} variant="primary">
                        Select Deck
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading cards...</p>
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plus className="w-12 h-12 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No Cards Yet</h3>
                    <p className="text-slate-600 mb-6">Create your first card for <strong>{currentDeck.title}</strong></p>
                    
                    {!showCardForm ? (
                        <div className="flex gap-3 justify-center">
                            <Button variant="primary" onClick={() => setShowCardForm(true)}>
                                <Plus className="w-4 h-4" />
                                Create Card
                            </Button>
                            <Button variant="secondary" onClick={() => setShowDeckSelector(true)}>
                                Change Deck
                            </Button>
                        </div>
                    ) : (
                        <CardForm 
                            onSubmit={handleCreateCard}
                            onCancel={() => setShowCardForm(false)}
                            isSaving={isSaving}
                            error={error}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
            
                        <div className="w-full px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200">
                            <div className="max-w-7xl mx-auto flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">{language === 'de' ? <GermanFlag/> : <USFlag/>}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">{currentDeck.title}</h2>
                                        <p className="text-sm text-slate-500">{learningLangName} • {currentIndex + 1} of {cards.length}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="secondary" onClick={() => setShowDeckSelector(true)} className="gap-2">
                                        <FolderOpen className="w-4 h-4" />
                                        Change Deck
                                    </Button>
                                    <Button variant="primary" onClick={() => setShowCardForm(!showCardForm)} className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Card
                                    </Button>
                                    <Button variant="secondary" onClick={deleteCurrentCard} className="text-red-600 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {showCardForm && (
                            <CardForm 
                                onSubmit={handleCreateCard}
                                onCancel={() => setShowCardForm(false)}
                                isSaving={isSaving}
                                error={error}
                            />
                        )}

                        {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <div className="w-full max-w-5xl">
                    {/* Flashcard */}
                    {currentCard && (
                        <div className="mb-10">
                            <div
                                className="relative w-full max-w-3xl mx-auto aspect-[16/10] cursor-pointer perspective-1000"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <div className={`w-full h-full relative preserve-3d transition-all duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
                                    {/* Front Side */}
                                    <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center justify-center p-12 backface-hidden hover:shadow-3xl transition-shadow">
                                        <div className="absolute top-6 left-6">
                                            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                                                {t('germanWord')}
                                            </span>
                                        </div>
                                        <h1 className="text-6xl font-serif text-slate-900 text-center mb-4">{currentCard.front_text}</h1>
                                        <div className="absolute bottom-6 flex items-center gap-2 text-slate-400 text-sm">
                                            <RefreshCw size={16} className="animate-spin-slow" />
                                            <span>{t('tapToFlip')}</span>
                                        </div>
                                    </div>

                                    {/* Back Side */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-600 rounded-3xl shadow-2xl flex flex-col p-12 backface-hidden rotate-y-180 overflow-hidden">
                                        <div className="mb-4 flex-shrink-0">
                                            <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                                                {t('translation')}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto text-white text-2xl font-medium leading-relaxed whitespace-pre-line [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {currentCard.back_text}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        <Button 
                            variant="secondary" 
                            onClick={() => { recordReview(false); nextCard(); }}
                            disabled={cards.length === 1}
                            className="px-8 py-4 text-base gap-3 bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                        >
                            <X size={20} className="font-bold" />
                            I don't know
                        </Button>
                        
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="px-8 py-4 text-base gap-3"
                        >
                            <RefreshCw size={20} />
                            Flip Card
                        </Button>

                        <Button 
                            variant="primary" 
                            onClick={() => { recordReview(true); nextCard(); }} 
                            disabled={cards.length === 1}
                            className="px-8 py-4 text-base gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                            <span className="text-xl">✓</span>
                            I know this
                        </Button>
                    </div>

                    {/* Keyboard Shortcuts - Bottom Center */}
                    <div className="mt-12 flex justify-center">
                        <div className="inline-flex items-center gap-6 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Shortcuts:</span>
                            <div className="flex items-center gap-4 text-sm text-slate-700">
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white rounded border border-slate-300 shadow-sm font-mono text-xs">↑</kbd>
                                    <span className="text-xs">Correct</span>
                                </div>
                                <div className="w-px h-4 bg-slate-300"></div>
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white rounded border border-slate-300 shadow-sm font-mono text-xs">↓</kbd>
                                    <span className="text-xs">Wrong</span>
                                </div>
                                <div className="w-px h-4 bg-slate-300"></div>
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white rounded border border-slate-300 shadow-sm font-mono text-xs">Space</kbd>
                                    <span className="text-xs">Flip</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Flashcards;
