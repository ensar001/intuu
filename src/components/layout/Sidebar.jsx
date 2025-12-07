import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart2, Brain, MessageSquare, BookOpen, Settings, X, ChevronDown, ChevronRight, Headphones, BookText, PenTool, Mic, GraduationCap, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../utils/translations';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, interfaceLanguage = 'en' }) => {
  const location = useLocation();
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const { t } = useTranslation(interfaceLanguage);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: BarChart2, path: '/dashboard' },
    { id: 'analyzer', label: t('textAnalyzer'), icon: Brain, path: '/text-analyzer' },
    { id: 'tutor', label: t('languageTutor'), icon: MessageSquare, path: '/language-tutor' },
    { id: 'flashcards', label: t('flashcards'), icon: BookOpen, path: '/flashcards' },
    { id: 'stats', label: t('statistics'), icon: TrendingUp, path: '/stats/learning-level' },
  ];

  const courseItems = [
    { id: 'listening', label: t('listening'), icon: Headphones, path: '/courses/listening' },
    { id: 'reading', label: t('reading'), icon: BookText, path: '/courses/reading' },
    { id: 'writing', label: t('writing'), icon: PenTool, path: '/courses/writing' },
    { id: 'speaking', label: t('speaking'), icon: Mic, path: '/courses/speaking' },
    { id: 'grammar', label: t('grammarAwareness'), icon: GraduationCap, path: '/courses/grammar' },
  ];

  const isActive = (path) => {
    if (path === '/stats/learning-level') {
      return location.pathname.startsWith('/stats');
    }
    return location.pathname === path;
  };
  const isCoursesActive = location.pathname.startsWith('/courses');

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">I</div>
          <span>Intuu</span>
        </Link>
        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <nav className="px-3 space-y-1 mt-6">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${isActive(item.path) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}

        {/* Courses Section */}
        <div className="pt-2">
          <button
            onClick={() => setIsCoursesOpen(!isCoursesOpen)}
            className={`
              w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${isCoursesActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            <div className="flex items-center gap-3">
              <BookOpen size={20} />
              <span>{t('courses')}</span>
            </div>
            {isCoursesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isCoursesOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {courseItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.path) ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/settings"
          onClick={() => setIsSidebarOpen(false)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
            ${isActive('/settings') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
          `}
        >
          <Settings size={20} />
          {t('settings')}
        </Link>
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold">A</div>
           <div>
             <p className="text-sm font-medium">Alex User</p>
             <p className="text-xs text-slate-500">Pro Plan</p>
           </div>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
