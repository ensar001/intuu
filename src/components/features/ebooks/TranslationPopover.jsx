import { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { translateText } from '../../../utils/ebookApi';

const TranslationPopover = ({ selectedText, position, onClose, sourceLanguage, targetLanguage }) => {
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasTranslated = useRef(false);

  useEffect(() => {
    if (!hasTranslated.current) {
      hasTranslated.current = true;
      loadTranslation();
    }
  }, []);

  const loadTranslation = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Translating:', selectedText.substring(0, 50) + '...', 'from', sourceLanguage, 'to', targetLanguage);
      const result = await translateText(selectedText, targetLanguage, sourceLanguage);
      console.log('Translation result:', result);
      setTranslation(result);
    } catch (err) {
      console.error('Translation error details:', err);
      setError(err.message || 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-educational-lg border border-slate-200 max-w-md w-full"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">Translation</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Original Text */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            {sourceLanguage === 'de' ? 'German' : sourceLanguage === 'en' ? 'English' : 'Original'}
          </p>
          <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">
            {selectedText}
          </p>
        </div>

        {/* Translation */}
        <div>
          <p className="text-xs font-medium text-primary-600 mb-1 uppercase tracking-wide">
            {targetLanguage === 'en' ? 'English' : targetLanguage === 'de' ? 'German' : 'Translation'}
          </p>
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          ) : (
            <p className="text-sm text-slate-800 bg-primary-50 p-3 rounded-lg font-medium">
              {translation}
            </p>
          )}
        </div>
      </div>

      {/* Tip */}
      {!loading && !error && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
            💡 Click anywhere outside to close this popup
          </p>
        </div>
      )}
    </div>
  );
};

export default TranslationPopover;
