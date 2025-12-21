import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CheckCircle, Brain, Award, ChevronRight, MessageSquare, Flame, BookOpen, Library } from 'lucide-react';
import Card from '../ui/Card';
import { LANGUAGES } from '../../utils/constants';
import { useTranslation } from '../../utils/translations';
import { useUserStats } from '../../hooks/useUserStats';
import { useAuth } from '../../contexts/AuthContext';
import { userStatsApi } from '../../utils/userStatsApi';

const Dashboard = ({ currentLanguage, setLanguage, interfaceLanguage = 'en' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation(interfaceLanguage);
  const { user } = useAuth();
  const { stats, loading, learningLevel, weeklyGoalProgress } = useUserStats();
  const [recentWords, setRecentWords] = useState([]);

  useEffect(() => {
    const loadRecentWords = async () => {
      if (user) {
        try {
          const words = await userStatsApi.getLearnedWords(user.id, currentLanguage, 5);
          setRecentWords(words);
        } catch (err) {
          console.error('Failed to load recent words:', err);
        }
      }
    };
    loadRecentWords();
  }, [user, currentLanguage]);

  const languagePhrases = {
    de: { phrase: "Guten Tag", meaning: "Good day" },
    tr: { phrase: "Merhaba", meaning: "Hello" },
    es: { phrase: "Hola", meaning: "Hello" },
    fr: { phrase: "Bonjour", meaning: "Good day" },
    it: { phrase: "Ciao", meaning: "Hello" },
  };

  const currentPhrase = languagePhrases[currentLanguage] || languagePhrases.de;

  return (
    <div className="space-y-8 relative">
      {/* Cork Board Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-[0.15]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23CD9B5B' fill-opacity='0.4'%3E%3Ccircle cx='10' cy='10' r='1.5'/%3E%3Ccircle cx='30' cy='15' r='1'/%3E%3Ccircle cx='50' cy='8' r='1.2'/%3E%3Ccircle cx='70' cy='12' r='0.8'/%3E%3Ccircle cx='85' cy='18' r='1.5'/%3E%3Ccircle cx='20' cy='35' r='1.3'/%3E%3Ccircle cx='45' cy='40' r='0.9'/%3E%3Ccircle cx='65' cy='38' r='1.4'/%3E%3Ccircle cx='90' cy='42' r='1.1'/%3E%3Ccircle cx='15' cy='60' r='1'/%3E%3Ccircle cx='35' cy='65' r='1.2'/%3E%3Ccircle cx='55' cy='62' r='0.8'/%3E%3Ccircle cx='75' cy='68' r='1.5'/%3E%3Ccircle cx='25' cy='85' r='1.3'/%3E%3Ccircle cx='48' cy='88' r='1'/%3E%3Ccircle cx='70' cy='90' r='1.2'/%3E%3Ccircle cx='92' cy='85' r='0.9'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#F5E6D3'
      }}></div>
      
      {/* Welcome Section */}
      <div className="py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="inline-block px-4 py-1.5 bg-primary-50 rounded-full text-sm font-medium mb-3 text-primary-700">
              {currentPhrase.phrase} · {currentPhrase.meaning}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-slate-800">
              {t('welcomeBack')}, {user?.email?.split('@')[0] || 'Student'}!
            </h1>
            <div className="flex items-center gap-2">
              {stats && stats.current_streak > 0 ? (
                <>
                  <Flame className="w-6 h-6 text-secondary-500" />
                  <p className="text-lg text-slate-700">
                    <span className="font-bold text-secondary-600">{stats.current_streak}</span> day streak! Keep going 🔥
                  </p>
                </>
              ) : (
                <p className="text-lg text-slate-700">Start your learning journey today! ✨</p>
              )}
            </div>
          </div>
          
          {/* Language Selector */}
          <div className="flex gap-2 flex-wrap">
            {LANGUAGES.map(lang => (
              <button 
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 transition-all font-medium ${
                  currentLanguage === lang.id 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          onClick={() => navigate('/stats/learning-level')}
          className="p-6 flex items-center gap-4 border-l-4 border-l-secondary-500 cursor-pointer hover:shadow-educational-lg transition-all hover:-translate-y-1"
        >
           <div className="p-3 bg-secondary-100 text-secondary-600 rounded-full">
             <Brain size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500">{t('learningLevel')}</p>
             {loading ? (
               <p className="text-2xl font-bold text-slate-800">Loading...</p>
             ) : learningLevel ? (
               <p className="text-2xl font-bold text-slate-800">{learningLevel.level} {learningLevel.label}</p>
             ) : (
               <p className="text-2xl font-bold text-slate-800">A1 Beginner</p>
             )}
           </div>
        </Card>
        
        <Card 
          onClick={() => navigate('/stats/learning-level#words-mastered')}
          className="p-6 flex items-center gap-4 border-l-4 border-l-success-500 cursor-pointer hover:shadow-educational-lg transition-all hover:-translate-y-1"
        >
           <div className="p-3 bg-success-100 text-success-600 rounded-full">
             <CheckCircle size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500">{t('wordsMastered')}</p>
             {loading ? (
               <p className="text-2xl font-bold text-slate-800">...</p>
             ) : (
               <p className="text-2xl font-bold text-slate-800">{stats?.words_mastered || 0}</p>
             )}
           </div>
        </Card>
        
        <Card 
          onClick={() => navigate('/stats/learning-level#weekly-goals')}
          className="p-6 flex items-center gap-4 border-l-4 border-l-primary-500 cursor-pointer hover:shadow-educational-lg transition-all hover:-translate-y-1"
        >
           <div className="p-3 bg-primary-100 text-primary-600 rounded-full">
             <Award size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500">{t('weeklyGoal')}</p>
             {loading ? (
               <p className="text-2xl font-bold text-slate-800">...</p>
             ) : (
               <p className="text-2xl font-bold text-slate-800">{weeklyGoalProgress}%</p>
             )}
           </div>
        </Card>
      </div>

      {/* Main Learning Tools */}
      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Your Learning Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Analyzer Card with Image */}
          <div 
            onClick={() => navigate('/text-analyzer')}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-warm hover:shadow-2xl transition-all hover:-translate-y-2 h-72"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600"></div>
            <div 
              className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80')` }}
            ></div>
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm20 0a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 37a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm10-17h20v20H20V20zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            {/* Content */}
            <div className="relative h-full p-8 flex flex-col justify-between text-white">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
                    Grammar Focus
                  </span>
                  <Brain size={28} className="text-white/90" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Text Analyzer</h3>
                <p className="text-white/90 text-base leading-relaxed">
                  Analyze grammar structures, cases, and verb forms at your level with AI-powered insights.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-base font-semibold bg-white text-primary-600 px-6 py-3 rounded-xl group-hover:bg-white/95 transition-all shadow-lg">
                  Start Analysis <ChevronRight size={18} />
                </span>
              </div>
            </div>
          </div>

          {/* Language Tutor Card with Image */}
          <div 
            onClick={() => navigate('/language-tutor')}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-warm hover:shadow-2xl transition-all hover:-translate-y-2 h-72"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-500 to-secondary-700"></div>
            <div 
              className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80')` }}
            ></div>
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`
            }}></div>

            {/* Content */}
            <div className="relative h-full p-8 flex flex-col justify-between text-white">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
                    AI Correction
                  </span>
                  <MessageSquare size={28} className="text-white/90" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Language Tutor</h3>
                <p className="text-white/90 text-base leading-relaxed">
                  Write and get instant corrections on grammar, cases, and natural expression.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-base font-semibold bg-white text-secondary-600 px-6 py-3 rounded-xl group-hover:bg-white/95 transition-all shadow-lg">
                  Open Chat <ChevronRight size={18} />
                </span>
              </div>
            </div>
          </div>

          {/* Flashcards Card with Image */}
          <div 
            onClick={() => navigate('/flashcards')}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-warm hover:shadow-2xl transition-all hover:-translate-y-2 h-72"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-success-500 to-success-700"></div>
            <div 
              className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80')` }}
            ></div>
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h20L0 20z'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            {/* Content */}
            <div className="relative h-full p-8 flex flex-col justify-between text-white">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
                    Memory Mastery
                  </span>
                  <BookOpen size={28} className="text-white/90" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Flashcards</h3>
                <p className="text-white/90 text-base leading-relaxed">
                  Master vocabulary with spaced repetition and smart review algorithms.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-base font-semibold bg-white text-success-600 px-6 py-3 rounded-xl group-hover:bg-white/95 transition-all shadow-lg">
                  Start Learning <ChevronRight size={18} />
                </span>
              </div>
            </div>
          </div>

          {/* E-Books Card with Image */}
          <div 
            onClick={() => navigate('/ebooks')}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-warm hover:shadow-2xl transition-all hover:-translate-y-2 h-72"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500 to-accent-700"></div>
            <div 
              className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80')` }}
            ></div>
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15zm0 28C7.82 28 2 22.18 2 15S7.82 2 15 2s13 5.82 13 13-5.82 13-13 13z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`
            }}></div>

            {/* Content */}
            <div className="relative h-full p-8 flex flex-col justify-between text-white">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
                    Immersive Reading
                  </span>
                  <Library size={28} className="text-white/90" />
                </div>
                <h3 className="text-3xl font-bold mb-3">E-Books</h3>
                <p className="text-white/90 text-base leading-relaxed">
                  Read books with instant AI-powered translations and audio narration.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-base font-semibold bg-white text-accent-600 px-6 py-3 rounded-xl group-hover:bg-white/95 transition-all shadow-lg">
                  Open Library <ChevronRight size={18} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Vocabulary */}
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 border border-slate-200 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800">Recent Vocabulary</h3>
          <button onClick={() => navigate('/flashcards')} className="text-sm text-primary-600 font-semibold hover:underline px-4 py-2 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
            View all →
          </button>
        </div>
        {recentWords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-slate-400 text-lg">No vocabulary learned yet</p>
            <p className="text-sm text-slate-400 mt-2">Start learning with flashcards to build your vocabulary!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWords.map((item, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group"
                onClick={() => navigate('/flashcards')}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    item.mastery_level === 3 ? 'bg-success-100' : 
                    item.mastery_level === 2 ? 'bg-primary-100' : 
                    'bg-secondary-100'
                  }`}>
                    {item.mastery_level === 3 ? '⭐' : item.mastery_level === 2 ? '✓' : '📝'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg group-hover:text-primary-600 transition-colors">{item.word}</p>
                    <p className="text-sm text-slate-500">
                      {item.mastery_level === 3 ? 'Mastered' : item.mastery_level === 2 ? 'Known' : 'Learning'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400 group-hover:text-primary-600 transition-colors" size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
