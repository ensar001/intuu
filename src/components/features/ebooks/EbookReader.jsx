import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, BookMarked, Settings, Type, Volume2, VolumeX, Pause, Play, CheckCircle2 } from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import TranslationPopover from './TranslationPopover';
import { getBookById, updateReadingProgress, markBookComplete } from '../../../utils/ebookApi';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabaseClient';
import { userStatsApi } from '../../../utils/userStatsApi';
import { splitIntoSentences } from '../../../utils/textUtils';

const EbookReader = ({ currentLanguage, interfaceLanguage = 'en' }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const contentRef = useRef(null);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [charsPerPage] = useState(2000);
  const [fontSize, setFontSize] = useState(16);
  const [selectedText, setSelectedText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationPosition, setTranslationPosition] = useState({ top: 0, left: 0 });
  
  // TTS state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [highlightedText, setHighlightedText] = useState(''); // Current sentence text from Polly
  const [speechMarks, setSpeechMarks] = useState([]);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  useEffect(() => {
    // Save progress when page changes
    if (book && currentPage !== book.current_page) {
      const progress = Math.round((currentPage / book.total_pages) * 100);
      updateReadingProgress(book.id, currentPage, progress);
    }
  }, [currentPage, book]);

  useEffect(() => {
    // Handle text selection
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && contentRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);
        
        // Get selection position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setTranslationPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + rect.width / 2,
        });
        
        setShowTranslation(true);
      } else {
        setShowTranslation(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [book]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const data = await getBookById(bookId);
      setBook(data);
      setCurrentPage(data.current_page || 1);
    } catch (error) {
      console.error('Failed to load book:', error);
      alert('Failed to load book');
      navigate('/ebooks');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPageContent = () => {
    if (!book) return '';
    const start = (currentPage - 1) * charsPerPage;
    const end = start + charsPerPage;
    return book.content.slice(start, end);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (book && currentPage < book.total_pages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinishBook = async () => {
    if (!book || !user || isFinishing) return;

    try {
      setIsFinishing(true);
      
      // Mark book as complete in database
      await markBookComplete(book.id);
      
      // Record activity for streak tracking
      await userStatsApi.recordActivity(user.id, 'flashcard_reviews', 1);
      
      // Show success message
      const confirmed = confirm(
        `🎉 Congratulations! You've finished "${book.title}"!\n\n` +
        `This counts toward your daily learning streak. Keep it up! 🔥\n\n` +
        `Return to library?`
      );
      
      if (confirmed) {
        navigate('/ebooks');
      } else {
        // Reload book to show completed status
        await loadBook();
      }
    } catch (error) {
      console.error('Failed to finish book:', error);
      alert('Failed to mark book as complete. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleFontSizeChange = (delta) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)));
  };

  const handleCloseTranslation = () => {
    setShowTranslation(false);
    window.getSelection()?.removeAllRanges();
  };

  const synthesizeSpeech = async () => {
    if (!book || isSynthesizing) return;

    try {
      setIsSynthesizing(true);
      setIsCached(false);
      setHighlightedText('');
      
      // Get current page text without formatting markers
      const pageText = getCurrentPageContent()
        .replace(/###\s/g, '') // Remove heading markers
        .replace(/---/g, '') // Remove page break markers
        .replace(/\n\n+/g, '\n') // Reduce multiple newlines
        .trim();

      if (!pageText) {
        alert('No text to read on this page');
        return;
      }

      // Note: sentences will come from backend for precise matching
      console.log(`[TTS] Sending text to backend for synthesis and sentence splitting`);

      // Get user's auth token from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        alert('Please log in to use text-to-speech');
        return;
      }

      const token = session.access_token;
      const playbackLanguage = book?.language || currentLanguage || 'en';

      const response = await fetch('http://localhost:3001/api/tts/synthesize-chunked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: pageText,
          language: playbackLanguage
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to synthesize speech');
      }

      // Response is now JSON with audioUrl
      const data = await response.json();
      
      console.log('[TTS] Received:', data);
      console.log('[TTS] Speech marks:', data.speechMarks?.length || 0, 'timing points');
      if (data.speechMarks?.length > 0) {
        console.log('[TTS] First mark example:', JSON.stringify(data.speechMarks[0]));
      }
      
      setAudioUrl(data.audioUrl);
      setIsCached(data.cached);
      setSpeechMarks(data.speechMarks || []);
      setHighlightedText('');
      setIsPlaying(true);

    } catch (error) {
      console.error('TTS error:', error);
      alert(`Failed to generate speech: ${error.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const syncHighlightWithAudio = () => {
    if (!audioRef.current || !speechMarks.length) return;
    
    const currentTime = audioRef.current.currentTime * 1000; // Convert to milliseconds
    
    // Find current sentence from Polly speech marks using timestamps
    let currentMark = null;
    for (let i = 0; i < speechMarks.length; i++) {
      if (currentTime >= speechMarks[i].time) {
        currentMark = speechMarks[i];
      } else {
        break;
      }
    }
    
    // Update highlighted text if changed
    const newText = currentMark?.value || '';
    if (newText !== highlightedText) {
      console.log(`[TTS Sync] time=${Math.round(currentTime)}ms, highlighting: "${newText.substring(0, 50)}..."`);
      setHighlightedText(newText);
    }
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(syncHighlightWithAudio);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      syncHighlightWithAudio();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioUrl(null);
    setHighlightedText('');
    setSpeechMarks([]);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Cleanup audio on unmount or page change
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [currentPage]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Auto-play audio when URL is set
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
        alert('Failed to play audio. Please try clicking the play button.');
      });
    }
  }, [audioUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Book not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
    {/* Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                icon={ArrowLeft}
                onClick={() => navigate('/ebooks')}
              >
                Library
              </Button>
              <div className="hidden md:block">
                <h1 className="font-bold text-slate-800">{book.title}</h1>
                {book.author && (
                <p className="text-sm text-slate-500">{book.author}</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* TTS Controls */}
              {!audioUrl ? (
                <button
                  onClick={synthesizeSpeech}
                  disabled={isSynthesizing}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                  title="Read page aloud"
                >
                  {isSynthesizing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm hidden md:inline">
                        {isCached ? 'Loading...' : 'Generating...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span className="text-sm hidden md:inline">Listen</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={stopAudio}
                    className="p-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    title="Stop"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                  <a
                    href={audioUrl}
                    download={`${book.title}-page-${currentPage}.mp3`}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    title="Download audio"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  {isCached && (
                    <span className="hidden lg:inline text-xs text-green-600 font-medium">
                      (Cached)
                    </span>
                  )}
                </div>
              )}
              
              <div className="w-px h-6 bg-slate-300 mx-2" />
              
              {/* Font Size Controls */}
              <button
                onClick={() => handleFontSizeChange(-2)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Decrease font size"
              >
                <Type className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600 font-medium w-12 text-center">
                {fontSize}px
              </span>
              <button
                onClick={() => handleFontSizeChange(2)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Increase font size"
              >
                <Type className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            </div>
          </div>
        </div>

        {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 md:p-12">
          {/* Mobile Book Title */}
          <div className="md:hidden mb-6 pb-6 border-b border-slate-200">
            <h1 className="font-bold text-lg text-slate-800">{book.title}</h1>
            {book.author && (
              <p className="text-sm text-slate-500 mt-1">{book.author}</p>
            )}
          </div>

          {/* Reading Content */}
          <div
            ref={contentRef}
            className="prose prose-slate max-w-none select-text"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: '1.8',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
            }}
          >
            {getCurrentPageContent().split('\n').map((line, index) => {
              // Detect headings (lines starting with ### or trimmed line starts with ###)
              const trimmedLine = line.trim();
              
              if (trimmedLine.startsWith('### ')) {
                // Check if this is the first heading AND we're on page 1 (title)
                const allLines = getCurrentPageContent().split('\n');
                const headingsBeforeThisOne = allLines.slice(0, index).filter(l => l.trim().startsWith('### ')).length;
                const isBookTitle = currentPage === 1 && headingsBeforeThisOne === 0;
                
                return (
                  <h3 key={index} className={isBookTitle 
                    ? "text-4xl font-bold text-primary-600 mt-4 mb-8 text-center"
                    : "text-2xl font-bold text-slate-900 mt-6 mb-3"}>
                    {trimmedLine.replace('### ', '')}
                  </h3>
                );
              }
              // Detect page breaks
              if (line.trim() === '---') {
                return (
                  <div key={index} className="my-8 border-t border-slate-300 opacity-50" />
                );
              }
              // Empty lines create paragraph spacing
              if (line.trim() === '') {
                return <div key={index} className="h-4" />;
              }
              // Regular paragraphs with sentence-level highlighting
              const lineText = line.trim();
              const lineSentences = splitIntoSentences(lineText);

              return (
                <p key={index} className="text-slate-800 mb-2 text-justify leading-relaxed">
                  {lineSentences.map((sentence, sentIndex) => {
                    // Check if this sentence matches the currently highlighted text from Polly
                    // Use includes for more forgiving match (Polly may have slight variations)
                    const sentenceNorm = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
                    const highlightNorm = highlightedText?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
                    const isHighlighted = highlightNorm && (
                      sentenceNorm === highlightNorm ||
                      sentenceNorm.includes(highlightNorm) ||
                      highlightNorm.includes(sentenceNorm)
                    );
                    
                    return (
                      <span 
                        key={sentIndex}
                        className={isHighlighted ? 'bg-yellow-300 px-1 rounded' : ''}
                      >
                        {sentence}{' '}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>

          {/* Page Navigation */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                icon={ChevronLeft}
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  Page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
                  <span className="font-bold text-slate-800">{book.total_pages}</span>
                </span>
                <div className="hidden md:block w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                    style={{ width: `${(currentPage / book.total_pages) * 100}%` }}
                  />
                </div>
              </div>

              {currentPage === book.total_pages ? (
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={handleFinishBook}
                  disabled={isFinishing || book.completed}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isFinishing ? 'Finishing...' : book.completed ? 'Completed ✓' : 'Finish Reading'}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleNextPage}
                  disabled={currentPage === book.total_pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-900 text-center">
            💡 <span className="font-semibold">Tip:</span> Select any word or sentence to see its translation, or click "Listen" to hear the page read aloud
          </p>
        </div>
      </div>

      {/* Hidden Audio Player */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setHighlightedText('');
          }}
          onPlay={() => {
            setIsPlaying(true);
            syncHighlightWithAudio();
          }}
          onPause={() => {
            setIsPlaying(false);
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
            }
          }}
        />
      )}

      {/* Translation Popover */}
      {showTranslation && selectedText && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={handleCloseTranslation}
          />
          <TranslationPopover
            selectedText={selectedText}
            position={translationPosition}
            onClose={handleCloseTranslation}
            sourceLanguage={book.language}
            targetLanguage={interfaceLanguage}
          />
        </>
      )}
    </div>
  );
};

export default EbookReader;
