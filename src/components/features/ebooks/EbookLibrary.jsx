import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, Clock, BookMarked, Search } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import ImportEbook from './ImportEbook';
import { getUserBooks, deleteBook } from '../../../utils/ebookApi';
import { useAuth } from '../../../contexts/AuthContext';

const EbookLibrary = ({ currentLanguage }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadBooks();
  }, [user]);

  const loadBooks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserBooks(user.id);
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = (newBook) => {
    setBooks(prev => [newBook, ...prev]);
  };

  const handleDeleteBook = async (bookId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(bookId);
      await deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Failed to delete book. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Library</h1>
          <p className="text-slate-600 mt-1">Read and translate your favorite books with AI</p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowImport(true)}
        >
          Import Book
        </Button>
      </div>

      {/* Search Bar */}
      {books.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books by title or author..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && books.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No books yet</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Import your first e-book to start reading with AI-powered translations
          </p>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowImport(true)}
          >
            Import Your First Book
          </Button>
        </Card>
      )}

      {/* Books Grid */}
      {!loading && filteredBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card
              key={book.id}
              onClick={() => navigate(`/ebooks/${book.id}`)}
              className="p-6 cursor-pointer hover:shadow-educational-lg transition-all hover:-translate-y-1 group"
            >
              {/* Book Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mb-4 shadow-warm">
                <BookOpen className="w-8 h-8 text-white" />
              </div>

              {/* Book Info */}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-sm text-slate-500 mb-2">{book.author}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(book.created_at)}
                  </span>
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium uppercase">
                    {book.file_type}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{book.reading_progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
                    style={{ width: `${book.reading_progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BookMarked className="w-4 h-4" />
                  <span>Page {book.current_page}/{book.total_pages}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteBook(book.id, e)}
                  disabled={deletingId === book.id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete book"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Search Results */}
      {!loading && books.length > 0 && filteredBooks.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-slate-600">
            No books found matching "{searchQuery}"
          </p>
        </Card>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportEbook
          onClose={() => setShowImport(false)}
          onSuccess={handleImportSuccess}
          currentLanguage={currentLanguage}
        />
      )}
    </div>
  );
};

export default EbookLibrary;
