import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/features/Dashboard';
import TextAnalyzer from './components/features/TextAnalyzer';
import GermanTutor from './components/features/GermanTutor';
import Flashcards from './components/features/Flashcards';
import Listening from './components/features/courses/Listening';
import Reading from './components/features/courses/Reading';
import Writing from './components/features/courses/Writing';
import Speaking from './components/features/courses/Speaking';
import GrammarAwareness from './components/features/courses/GrammarAwareness';
import LearningLevel from './components/features/stats/LearningLevel';

const App = () => {
  const [currentLanguage, setCurrentLanguage] = useState('de');
  const [interfaceLanguage, setInterfaceLanguage] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
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
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard currentLanguage={currentLanguage} setLanguage={setCurrentLanguage} interfaceLanguage={interfaceLanguage} />} />
                <Route path="/text-analyzer" element={<TextAnalyzer currentLanguage={currentLanguage} interfaceLanguage={interfaceLanguage} />} />
                <Route path="/language-tutor" element={<GermanTutor currentLanguage={currentLanguage} interfaceLanguage={interfaceLanguage} />} />
                <Route path="/flashcards" element={<Flashcards language={currentLanguage} interfaceLanguage={interfaceLanguage} />} />
                <Route path="/courses/listening" element={<Listening interfaceLanguage={interfaceLanguage} />} />
                <Route path="/courses/reading" element={<Reading interfaceLanguage={interfaceLanguage} />} />
                <Route path="/courses/writing" element={<Writing interfaceLanguage={interfaceLanguage} />} />
                <Route path="/courses/speaking" element={<Speaking interfaceLanguage={interfaceLanguage} />} />
                <Route path="/courses/grammar" element={<GrammarAwareness interfaceLanguage={interfaceLanguage} />} />
                <Route path="/stats/learning-level" element={<LearningLevel interfaceLanguage={interfaceLanguage} />} />
                <Route path="/stats/words-mastered" element={<Navigate to="/stats/learning-level" replace />} />
                <Route path="/stats/weekly-goals" element={<Navigate to="/stats/learning-level" replace />} />
                <Route path="/settings" element={
                  <div className="text-center py-20 text-slate-500">
                    <Settings size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Settings panel coming soon.</p>
                  </div>
                } />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;