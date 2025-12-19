import { useState } from 'react';
import { Upload, X, FileText, BookOpen, File } from 'lucide-react';
import Button from '../../ui/Button';
import { validateEbookFile, uploadEbook } from '../../../utils/ebookApi';
import { useAuth } from '../../../contexts/AuthContext';

const ImportEbook = ({ onClose, onSuccess, currentLanguage }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError(null);
    const validation = validateEbookFile(selectedFile);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      const book = await uploadEbook(file, user.id, currentLanguage);
      onSuccess(book);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload e-book');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12 text-slate-400" />;
    
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (extension === '.pdf') return <File className="w-12 h-12 text-red-500" />;
    if (extension === '.epub') return <BookOpen className="w-12 h-12 text-primary-500" />;
    return <FileText className="w-12 h-12 text-slate-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-educational-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Import E-Book</h2>
              <p className="text-sm text-slate-500">Upload your favorite book to read</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-slate-600 text-sm">
            Import your digital copy of your favorite book here! Just drag and drop in the selected area or choose a file from your computer. All imported books are private and only visible to you.
          </p>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : file
                ? 'border-success-300 bg-success-50'
                : 'border-slate-300 bg-slate-50 hover:border-primary-400'
            }`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {getFileIcon()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  disabled={uploading}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Upload className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-700 mb-2">
                    Drag and drop your file here or{' '}
                    <label className="text-primary-600 font-medium cursor-pointer hover:text-primary-700">
                      Select file
                      <input
                        type="file"
                        className="hidden"
                        accept=".txt,.pdf,.epub"
                        onChange={handleFileInputChange}
                        disabled={uploading}
                      />
                    </label>
                  </p>
                  <p className="text-sm text-slate-500">
                    Supported formats: <span className="font-medium">TXT, PDF, EPUB</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Maximum file size: 50MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-sm text-primary-900">
              <span className="font-semibold">Tip:</span> Once uploaded, you can click any word or sentence in the book to get instant translations powered by AI.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || uploading}
            icon={uploading ? null : BookOpen}
          >
            {uploading ? 'Uploading...' : 'Import Book'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportEbook;
