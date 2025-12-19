import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CheckCircle, Brain, Award, ChevronRight, MessageSquare, Headphones, BookText, PenTool, Mic, GraduationCap, Flame, BookOpen, Library } from 'lucide-react';
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

  const courseCards = [
    { id: 'listening', label: t('listening'), icon: Headphones, path: '/courses/listening', color: 'from-primary-500 to-primary-600', emoji: '🎧' },
    { id: 'reading', label: t('reading'), icon: BookText, path: '/courses/reading', color: 'from-success-500 to-success-600', emoji: '📖' },
    { id: 'writing', label: t('writing'), icon: PenTool, path: '/courses/writing', color: 'from-accent-500 to-accent-600', emoji: '✍️' },
    { id: 'speaking', label: t('speaking'), icon: Mic, path: '/courses/speaking', color: 'from-secondary-500 to-secondary-600', emoji: '🎤' },
    { id: 'grammar', label: t('grammarAwareness'), icon: GraduationCap, path: '/courses/grammar', color: 'from-primary-600 to-accent-600', emoji: '📚' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('welcomeBack')}, {user?.email?.split('@')[0] || 'Student'}!</h1>
          <div className="flex items-center gap-2 mt-1">
            {stats && stats.current_streak > 0 && (
              <>
                <Flame className="w-5 h-5 text-secondary-500" />
                <p className="text-slate-600">
                  You're on a <span className="font-bold text-secondary-600">{stats.current_streak}</span>-day streak! 🔥
                </p>
              </>
            )}
            {(!stats || stats.current_streak === 0) && (
              <p className="text-slate-600">Start your learning streak today!</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
           {LANGUAGES.map(lang => (
             <button 
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${currentLanguage === lang.id ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-educational' : 'bg-white border-slate-200 text-slate-600 hover:bg-primary-50'}`}
             >
               <span>{lang.flag}</span>
               <span className="font-medium">{lang.name}</span>
             </button>
           ))}
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

      {/* Recommended Activities */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">Recommended for You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => navigate('/text-analyzer')}
            className="group bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-6 text-white cursor-pointer shadow-warm hover:shadow-educational-lg transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Grammar Focus</span>
                <Brain size={24} className="text-white/80" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Text Analyzer</h3>
              <p className="text-primary-100 mb-6 text-sm">Analyze grammar structures, cases, and verb forms at your level.</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-primary-600 px-4 py-2 rounded-lg group-hover:bg-primary-50 transition-colors">
                Start Analysis <ChevronRight size={16} />
              </span>
            </div>
            {/* Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          </div>

          <div 
            onClick={() => navigate('/language-tutor')}
            className="group bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-educational-lg hover:border-secondary-300 transition-all hover:-translate-y-1"
          >
             <div className="flex justify-between items-start mb-4">
                <span className="bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full text-xs font-semibold">Correction</span>
                <MessageSquare size={24} className="text-secondary-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Language Tutor</h3>
              <p className="text-slate-500 mb-6 text-sm">Write and get instant corrections on grammar and cases.</p>
               <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 group-hover:text-secondary-600 transition-colors">
                Open Chat <ChevronRight size={16} />
              </span>
          </div>

          <div 
            onClick={() => navigate('/flashcards')}
            className="group bg-gradient-to-br from-success-500 to-success-600 rounded-2xl p-6 text-white cursor-pointer shadow-warm hover:shadow-educational-lg transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Memory</span>
                <BookOpen size={24} className="text-white/80" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Flashcards</h3>
              <p className="text-success-100 mb-6 text-sm">Master vocabulary with spaced repetition and smart review.</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-success-600 px-4 py-2 rounded-lg group-hover:bg-success-50 transition-colors">
                Start Learning <ChevronRight size={16} />
              </span>
            </div>
            {/* Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          </div>

          <div 
            onClick={() => navigate('/ebooks')}
            className="group bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 text-white cursor-pointer shadow-warm hover:shadow-educational-lg transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Reading</span>
                <Library size={24} className="text-white/80" />
              </div>
              <h3 className="text-2xl font-bold mb-2">E-Books</h3>
              <p className="text-accent-100 mb-6 text-sm">Read books with instant AI-powered word translations.</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-accent-600 px-4 py-2 rounded-lg group-hover:bg-accent-50 transition-colors">
                Open Library <ChevronRight size={16} />
              </span>
            </div>
            {/* Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">Courses</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {courseCards.map((course) => (
            <Card
              key={course.id}
              onClick={() => navigate(course.path)}
              className="p-6 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group text-center"
            >
              <div className="text-4xl mb-3">{course.emoji}</div>
              <h4 className="font-semibold text-slate-800 mb-1">{course.label}</h4>
              <p className="text-xs text-slate-500 group-hover:text-primary-600 transition-colors">Start learning</p>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Recent Vocabulary */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Recent Vocabulary</h3>
          <button onClick={() => navigate('/flashcards')} className="text-sm text-primary-600 font-medium hover:underline">View all</button>
        </div>
        {recentWords.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No vocabulary learned yet</p>
            <p className="text-sm mt-1">Start learning with flashcards!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWords.map((item, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-educational cursor-pointer hover:border-primary-300 hover:shadow-educational-lg transition-all"
                onClick={() => navigate('/flashcards')}
              >
                <div>
                  <p className="font-bold text-slate-800">{item.word}</p>
                  <p className="text-xs text-slate-500">
                    Mastery: {item.mastery_level === 3 ? '⭐ Mastered' : item.mastery_level === 2 ? '✓ Known' : '📝 Learning'}
                  </p>
                </div>
                <div className={`h-2 w-2 rounded-full ${
                  item.mastery_level === 3 ? 'bg-success-500' : 
                  item.mastery_level === 2 ? 'bg-primary-500' : 
                  'bg-secondary-500'
                }`}></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
