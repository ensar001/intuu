import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, BookMarked, Settings, Type } from 'lucide-react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import TranslationPopover from './TranslationPopover';
import { getBookById, updateReadingProgress } from '../../../utils/ebookApi';

const EbookReader = ({ currentLanguage, interfaceLanguage = 'en' }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [charsPerPage] = useState(2000);
  const [fontSize, setFontSize] = useState(16);
  const [selectedText, setSelectedText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationPosition, setTranslationPosition] = useState({ top: 0, left: 0 });

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

  const handleFontSizeChange = (delta) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)));
  };

  const handleCloseTranslation = () => {
    setShowTranslation(false);
    window.getSelection()?.removeAllRanges();
  };

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
              // Regular paragraphs
              return (
                <p key={index} className="text-slate-800 mb-2 text-justify leading-relaxed">
                  {line}
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

              <Button
                variant="secondary"
                onClick={handleNextPage}
                disabled={currentPage === book.total_pages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-900 text-center">
            💡 <span className="font-semibold">Tip:</span> Select any word or sentence to see its translation
          </p>
        </div>
      </div>

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
