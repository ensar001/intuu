import { useNavigate } from 'react-router-dom';
import { CheckCircle, Brain, Award, ChevronRight, MessageSquare, Headphones, BookText, PenTool, Mic, GraduationCap } from 'lucide-react';
import Card from '../ui/Card';
import { LANGUAGES } from '../../utils/constants';
import { useTranslation } from '../../utils/translations';

const Dashboard = ({ currentLanguage, setLanguage, interfaceLanguage = 'en' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation(interfaceLanguage);

  const courseCards = [
    { id: 'listening', label: t('listening'), icon: Headphones, path: '/courses/listening', color: 'from-blue-500 to-cyan-500', emoji: '🎧' },
    { id: 'reading', label: t('reading'), icon: BookText, path: '/courses/reading', color: 'from-green-500 to-emerald-500', emoji: '📖' },
    { id: 'writing', label: t('writing'), icon: PenTool, path: '/courses/writing', color: 'from-purple-500 to-pink-500', emoji: '✍️' },
    { id: 'speaking', label: t('speaking'), icon: Mic, path: '/courses/speaking', color: 'from-orange-500 to-red-500', emoji: '🎤' },
    { id: 'grammar', label: t('grammarAwareness'), icon: GraduationCap, path: '/courses/grammar', color: 'from-indigo-500 to-violet-500', emoji: '📚' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('welcomeBack')}, Ensar!</h1>
          <p className="text-slate-500 mt-1">{t('dayStreak', { days: 12 })}</p>
        </div>
        <div className="flex gap-2">
           {LANGUAGES.map(lang => (
             <button 
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${currentLanguage === lang.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
          className="p-6 flex items-center gap-4 border-l-4 border-l-amber-500 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
        >
           <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
             <Brain size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500">{t('learningLevel')}</p>
             <p className="text-2xl font-bold text-slate-800">C1 Advanced</p>
           </div>
        </Card>
        
        <Card 
          onClick={() => navigate('/stats/learning-level#words-mastered')}
          className="p-6 flex items-center gap-4 border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
        >
           <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
             <CheckCircle size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500">{t('wordsMastered')}</p>
             <p className="text-2xl font-bold text-slate-800">1,248</p>
           </div>
        </Card>
        
        <Card 
          onClick={() => navigate('/stats/learning-level#weekly-goals')}
          className="p-6 flex items-center gap-4 border-l-4 border-l-indigo-500 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
        >
           <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
             <Award size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500">{t('weeklyGoal')}</p>
             <p className="text-2xl font-bold text-slate-800">85%</p>
           </div>
        </Card>
      </div>

      {/* Recommended Activities */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">Recommended for You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => navigate('/text-analyzer')}
            className="group bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer shadow-lg shadow-indigo-200 hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Grammar Focus</span>
                <Brain size={24} className="text-white/80" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Text Analyzer</h3>
              <p className="text-indigo-100 mb-6 text-sm">Analyze grammar structures, cases, and verb forms at your level.</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-indigo-600 px-4 py-2 rounded-lg group-hover:bg-indigo-50 transition-colors">
                Start Analysis <ChevronRight size={16} />
              </span>
            </div>
            {/* Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          </div>

          <div 
            onClick={() => navigate('/language-tutor')}
            className="group bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg hover:border-amber-300 transition-all hover:-translate-y-1"
          >
             <div className="flex justify-between items-start mb-4">
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">Correction</span>
                <MessageSquare size={24} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Language Tutor</h3>
              <p className="text-slate-500 mb-6 text-sm">Write and get instant corrections on grammar and cases.</p>
               <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 group-hover:text-amber-600 transition-colors">
                Open Chat <ChevronRight size={16} />
              </span>
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
              <p className="text-xs text-slate-500 group-hover:text-indigo-600 transition-colors">Start learning</p>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Recent Vocabulary */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Recent Vocabulary</h3>
          <button onClick={() => navigate('/flashcards')} className="text-sm text-indigo-600 font-medium hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {[
            { word: "Serendipity", def: "The occurrence of events by chance in a happy way." },
            { word: "Mellifluous", def: "A sound that is sweet and musical; pleasant to hear." },
            { word: "Ineffable", def: "Too great or extreme to be expressed or described in words." }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
               <div>
                 <p className="font-bold text-slate-800">{item.word}</p>
                 <p className="text-xs text-slate-500">{item.def}</p>
               </div>
               <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
