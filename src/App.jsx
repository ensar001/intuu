import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Lazy load heavy components
const Login = lazy(() => import('./components/auth/Login'));
const Signup = lazy(() => import('./components/auth/Signup'));
const Dashboard = lazy(() => import('./components/features/Dashboard'));
const TextAnalyzer = lazy(() => import('./components/features/TextAnalyzer'));
const GermanTutor = lazy(() => import('./components/features/GermanTutor'));
const Flashcards = lazy(() => import('./components/features/Flashcards'));
const LearningLevel = lazy(() => import('./components/features/stats/LearningLevel'));
const Settings = lazy(() => import('./components/features/Settings'));
const EbookLibrary = lazy(() => import('./components/features/ebooks/EbookLibrary'));
const EbookReader = lazy(() => import('./components/features/ebooks/EbookReader'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

const App = () => {
  const [currentLanguage, setCurrentLanguage] = useState('de');
  const [interfaceLanguage, setInterfaceLanguage] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><Login /></Suspense>} />
          <Route path="/signup" element={<Suspense fallback={<LoadingFallback />}><Signup /></Suspense>} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex h-screen bg-white font-sans text-slate-900 overflow-hidden">
        
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          interfaceLanguage={interfaceLanguage}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header */}
          <Header 
            setIsSidebarOpen={setIsSidebarOpen}
            interfaceLanguage={interfaceLanguage}
            setInterfaceLanguage={setInterfaceLanguage}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50">
            <div className="max-w-5xl mx-auto h-full">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard currentLanguage={currentLanguage} setLanguage={setCurrentLanguage} interfaceLanguage={interfaceLanguage} />} />
                  <Route path="/text-analyzer" element={<TextAnalyzer currentLanguage={currentLanguage} interfaceLanguage={interfaceLanguage} />} />
                  <Route path="/language-tutor" element={<GermanTutor currentLanguage={currentLanguage} interfaceLanguage={interfaceLanguage} />} />
                  <Route path="/flashcards" element={<Flashcards language={currentLanguage} interfaceLanguage={interfaceLanguage} />} />
                  <Route path="/ebooks" element={<EbookLibrary currentLanguage={currentLanguage} />} />
                  <Route path="/ebooks/:bookId" element={<EbookReader currentLanguage={currentLanguage} interfaceLanguage={interfaceLanguage} />} />
                  <Route path="/stats/learning-level" element={<LearningLevel interfaceLanguage={interfaceLanguage} />} />
                  <Route path="/stats/words-mastered" element={<Navigate to="/stats/learning-level" replace />} />
                  <Route path="/stats/weekly-goals" element={<Navigate to="/stats/learning-level" replace />} />
                  <Route path="/settings" element={<Settings interfaceLanguage={interfaceLanguage} />} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;