import { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Plus, Sparkles, Loader2, Trash2, FolderOpen } from 'lucide-react';
import Button from '../ui/Button';
import { generateFlashcards } from '../../utils/geminiApi';
import { cardApi } from '../../utils/deckApi';
import { useAuth } from '../../contexts/AuthContext';
import { LANGUAGES } from '../../utils/constants';
import { useTranslation } from '../../utils/translations';
import DeckSelector from './DeckSelector';
import { validateTopic } from '../../utils/inputValidation';

const Flashcards = ({ language = 'de', interfaceLanguage = 'en' }) => {
    const { user } = useAuth();
    const { t } = useTranslation(interfaceLanguage);
    const learningLangConfig = LANGUAGES.find(lang => lang.id === language) || LANGUAGES[1];
    const learningLangName = learningLangConfig.name;
    
    const interfaceLangConfig = LANGUAGES.find(lang => lang.id === interfaceLanguage);
    const interfaceLangName = interfaceLangConfig ? interfaceLangConfig.name : 'English';
    
    const translationLang = language === interfaceLanguage ? 'en' : interfaceLanguage;
    const translationLangName = language === interfaceLanguage ? 'English' : interfaceLangName;

    const [currentDeck, setCurrentDeck] = useState(null);
    const [showDeckSelector, setShowDeckSelector] = useState(false);
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentCard = cards[currentIndex];

    useEffect(() => {
        // Show deck selector on mount if no deck selected
        if (!currentDeck) {
            setShowDeckSelector(true);
        }
    }, []);

    useEffect(() => {
        if (currentDeck) {
            loadCards();
        }
    }, [currentDeck]);

    const handleSelectDeck = (deck) => {
        setCurrentDeck(deck);
        setShowDeckSelector(false);
    };

    const loadCards = async () => {
        if (!currentDeck) return;
        
        setIsLoading(true);
        try {
            const data = await cardApi.getCards(currentDeck.id);
            setCards(data);
            setCurrentIndex(0);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to load cards:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
    };

    const generateCards = async () => {
        // Validate topic input
        const validation = validateTopic(topic);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        if (!currentDeck) return;
        setIsGenerating(true);

        try {
            const result = await generateFlashcards(
                validation.sanitized,
                learningLangName,
                interfaceLangName,
                translationLangName
            );

            const newCards = [];
            for (const card of result.cards) {
                const backContent = `${card.translation}\n\nExamples:\n${card.examples.map(ex => `• ${ex}`).join('\n')}`;
                const newCard = await cardApi.createCard(
                    currentDeck.id,
                    card.front,
                    backContent
                );
                newCards.push(newCard);
            }

            setCards([...cards, ...newCards]);
            setTopic("");
            setShowGenerator(false);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to generate cards:', error);
            }
            alert('Failed to generate flashcards. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteCurrentCard = async () => {
        if (!currentCard || cards.length === 0) return;
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            await cardApi.deleteCard(currentCard.id);
            const updatedCards = cards.filter(c => c.id !== currentCard.id);
            setCards(updatedCards);
            
            if (updatedCards.length === 0) {
                setCurrentIndex(0);
            } else {
                setCurrentIndex(Math.min(currentIndex, updatedCards.length - 1));
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to delete card:', error);
            }
            alert('Failed to delete card');
        }
    };

    const recordReview = async (quality) => {
        if (!currentCard) return;
        
        try {
            await cardApi.updateCard(currentCard.id, {
                next_review_at: new Date(Date.now() + 86400000 * (quality ? 3 : 1)).toISOString(),
            });
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Failed to record review:', error);
            }
        }
    };

    if (showDeckSelector) {
        return (
            <DeckSelector
                onSelectDeck={handleSelectDeck}
                onClose={() => setShowDeckSelector(false)}
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading cards...</p>
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plus className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No Cards Yet</h3>
                    <p className="text-slate-600 mb-6">
                        Add your first card to <strong>{currentDeck.title}</strong>
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="primary" onClick={() => setShowGenerator(true)}>
                            <Sparkles className="w-4 h-4" />
                            Generate Card
                        </Button>
                        <Button variant="secondary" onClick={() => setShowDeckSelector(true)}>
                            Change Deck
                        </Button>
                    </div>

                    {showGenerator && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                            <div className="flex gap-2">
                                <input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={t('enterWord')}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                                <Button
                                    variant="magic"
                                    onClick={generateCards}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-6">
            <div className="w-full flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{currentDeck.title}</h2>
                    <p className="text-sm text-slate-500">{t('language')}: {learningLangName}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">{currentIndex + 1} / {cards.length}</span>
                    <Button variant="secondary" onClick={() => setShowDeckSelector(true)} className="text-sm">
                        <FolderOpen className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" onClick={() => setShowGenerator(!showGenerator)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" onClick={deleteCurrentCard}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {showGenerator && (
                <div className="w-full p-4 mb-6 bg-indigo-50 rounded-xl animate-in slide-in-from-top-4 fade-in">
                    <div className="flex gap-2">
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={t('enterWord')}
                            className="flex-1 px-4 py-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Button
                            variant="magic"
                            onClick={generateCards}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            )}

            {currentCard && (
                <div
                    className="relative w-full aspect-[3/2] cursor-pointer perspective-1000 group"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front */}
                        <div className="absolute inset-0 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden">
                            <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4">{t('germanWord')}</div>
                            <h3 className="text-4xl font-serif text-slate-800 text-center">{currentCard.front_text}</h3>
                            <p className="mt-8 text-slate-400 text-sm flex items-center gap-2">
                                <RefreshCw size={14} /> {t('tapToFlip')}
                            </p>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-xl flex flex-col justify-center p-8 backface-hidden rotate-y-180">
                            <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-3">{t('translation')}</div>
                            <div className="text-white whitespace-pre-line">
                                {currentCard.back_text}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-4 mt-8">
                <Button variant="secondary" onClick={() => setIsFlipped(!isFlipped)}>{t('flipCard')}</Button>
                <Button 
                    variant="secondary" 
                    onClick={() => { recordReview(false); nextCard(); }}
                    disabled={cards.length === 1}
                >
                    ❌ {t('wrong')}
                </Button>
                <Button 
                    variant="primary" 
                    onClick={() => { recordReview(true); nextCard(); }} 
                    icon={ArrowRight}
                    disabled={cards.length === 1}
                >
                    ✓ {t('correct')}
                </Button>
            </div>
        </div>
    );
};

export default Flashcards;
