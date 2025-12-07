import { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Plus, Sparkles, Loader2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { callGemini } from '../../utils/geminiApi';
import { flashcardAPI } from '../../utils/flashcardApi';
import { LANGUAGES } from '../../utils/constants';
import { useTranslation } from '../../utils/translations';

const Flashcards = ({ language = 'de', interfaceLanguage = 'en' }) => {
    const { t } = useTranslation(interfaceLanguage);
    const learningLangConfig = LANGUAGES.find(lang => lang.id === language) || LANGUAGES[1];
    const learningLangName = learningLangConfig.name;
    
    const interfaceLangConfig = LANGUAGES.find(lang => lang.id === interfaceLanguage);
    const interfaceLangName = interfaceLangConfig ? interfaceLangConfig.name : 'English';
    
    // If learning language is same as interface language, use English as translation target
    const translationLang = language === interfaceLanguage ? 'en' : interfaceLanguage;
    const translationLangName = language === interfaceLanguage ? 'English' : interfaceLangName;
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load flashcards from backend on mount
    useEffect(() => {
        loadFlashcards();
    }, [language]); // Reload when language changes

    const loadFlashcards = async () => {
        setIsLoading(true);
        try {
            const data = await flashcardAPI.getAll(language);
            setCards(data);
            setCurrentIndex(0); // Reset to first card
            if (data.length === 0) {
                // Don't auto-create sample cards, let user create them
            }
        } catch (error) {
            console.error('Failed to load flashcards:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
    };

    const generateCards = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);

        const systemPrompt = `
      You are generating vocabulary flashcards for a ${learningLangName} language learner whose interface language is ${interfaceLangName}.
      The user provided: "${topic}"
      
      IMPORTANT: For German nouns, ALWAYS include the article (der/die/das) as part of the word.
      
      Determine the language of the input.
      - If it's a ${learningLangName} word: Create a flashcard with the ${learningLangName} word on the front (including article for German nouns), and on the back provide the ${translationLangName} translation plus 2 example sentences in ${learningLangName} using that word.
      - If it's NOT a ${learningLangName} word: Translate it to ${learningLangName} (including article for German nouns) and put the ${learningLangName} translation on the front, and on the back provide the ${translationLangName} translation plus 2 example sentences in ${learningLangName} using the word.
      
      Return JSON with a 'cards' array containing 1 flashcard object with:
      'front': the ${learningLangName} word or phrase (WITH article for German nouns like "der Tisch", "die Katze", "das Buch").
      'translation': the ${translationLangName} translation.
      'examples': an array of exactly 2 ${learningLangName} sentences using the word.
    `;

        try {
            const result = await callGemini(topic, systemPrompt, {
                type: "OBJECT",
                properties: {
                    cards: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                front: { type: "STRING" },
                                translation: { type: "STRING" },
                                examples: { type: "ARRAY", items: { type: "STRING" } }
                            }
                        }
                    }
                }
            });

            // Create flashcards in backend
            const newCards = [];
            for (const card of result.cards) {
                const backContent = `${card.translation}\n\nExamples:\n${card.examples.map(ex => `• ${ex}`).join('\n')}`;
                const newCard = await flashcardAPI.create({
                    front: card.front,
                    back: backContent,
                    language: language,
                    category: 'generated',
                    difficulty: 'medium'
                });
                newCards.push(newCard);
            }

            setCards(prev => [...prev, ...newCards]);
            setShowGenerator(false);
            setTopic("");
            
            // Jump to the first new card
            if (cards.length === 0) {
                setCurrentIndex(0); // If no cards existed, show first card
            } else {
                setCurrentIndex(cards.length); // Jump to first new card
            }
        } catch (e) {
            alert("Failed to generate cards: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteCurrentCard = async () => {
        if (cards.length === 0) return;
        try {
            await flashcardAPI.delete(currentCard.id, language);
            const newCards = cards.filter(c => c.id !== currentCard.id);
            setCards(newCards);
            if (currentIndex >= newCards.length) {
                setCurrentIndex(Math.max(0, newCards.length - 1));
            }
            setIsFlipped(false);
        } catch (error) {
            alert("Failed to delete card: " + error.message);
        }
    };

    const recordReview = async (correct) => {
        if (!currentCard) return;
        try {
            await flashcardAPI.recordReview(currentCard.id, correct, language);
        } catch (error) {
            console.error('Failed to record review:', error);
        }
    };

    const currentCard = cards[currentIndex];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-6">
                {!showGenerator ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('noFlashcardsYet')}</h2>
                        <p className="text-slate-500 mb-6">{t('createFirstCard')}</p>
                        <Button variant="magic" onClick={() => setShowGenerator(true)} icon={Plus}>
                            {t('createFirstCardBtn')}
                        </Button>
                    </div>
                ) : (
                    <div className="w-full">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('vocabularyDeck')}</h2>
                        <div className="w-full p-4 mb-6 bg-indigo-50 rounded-xl">
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
                                    icon={isGenerating ? Loader2 : Sparkles}
                                >
                                    {isGenerating ? t('generating') : t('generateDeck')}
                                </Button>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={() => setShowGenerator(false)}>
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-6">
            <div className="w-full flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('vocabularyDeck')}</h2>
                    <p className="text-sm text-slate-500">{t('language')}: {learningLangName}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-500">{currentIndex + 1} / {cards.length}</span>
                    <Button variant="secondary" onClick={() => setShowGenerator(!showGenerator)} icon={Plus}>{t('addCards')}</Button>
                    <Button variant="secondary" onClick={deleteCurrentCard} icon={Trash2}>{t('deleteCard')}</Button>
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
                            icon={isGenerating ? Loader2 : Sparkles}
                        >
                            {isGenerating ? t('generating') : t('generateDeck')}
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
                            <h3 className="text-4xl font-serif text-slate-800 text-center">{currentCard.front}</h3>
                            <p className="mt-8 text-slate-400 text-sm flex items-center gap-2">
                                <RefreshCw size={14} /> {t('tapToFlip')}
                            </p>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-xl flex flex-col justify-center p-8 backface-hidden rotate-y-180">
                            <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-3">{t('translation')}</div>
                            <div className="text-white whitespace-pre-line">
                                {currentCard.back}
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
