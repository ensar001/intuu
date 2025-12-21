import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart2, Brain, MessageSquare, BookOpen, Settings, X, TrendingUp, Library } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, interfaceLanguage = 'en' }) => {
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const { t } = useTranslation(interfaceLanguage);

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setUserName(data.username);
        }
      }
    };
    
    fetchUserName();
  }, []);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: BarChart2, path: '/dashboard' },
    { id: 'analyzer', label: t('textAnalyzer'), icon: Brain, path: '/text-analyzer' },
    { id: 'tutor', label: t('languageTutor'), icon: MessageSquare, path: '/language-tutor' },
    { id: 'flashcards', label: t('flashcards'), icon: BookOpen, path: '/flashcards' },
    { id: 'ebooks', label: 'E-Books', icon: Library, path: '/ebooks' },
    { id: 'stats', label: t('statistics'), icon: TrendingUp, path: '/stats/learning-level' },
  ];

  const isActive = (path) => {
    if (path === '/stats/learning-level') {
      return location.pathname.startsWith('/stats');
    }
    return location.pathname === path;
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-600 to-primary-700 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center justify-between border-b border-primary-500/30">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-8 h-8 bg-secondary-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-black">I</span>
          </div>
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
              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${isActive(item.path) ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'}
            `}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}

        <Link
          to="/settings"
          onClick={() => setIsSidebarOpen(false)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
            ${isActive('/settings') ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'}
          `}
        >
          <Settings size={20} />
          {t('settings')}
        </Link>
      </nav>

      <Link to="/settings" className="absolute bottom-0 w-full p-6 border-t border-primary-500/30 hover:bg-white/10 transition-colors" onClick={() => setIsSidebarOpen(false)}>
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary-400 to-secondary-500 flex items-center justify-center font-bold shadow-lg">
             {userName?.charAt(0).toUpperCase() || 'A'}
           </div>
           <div>
             <p className="text-sm font-medium">{userName || 'User'}</p>
             <p className="text-xs text-white/70">Pro Plan</p>
           </div>
         </div>
      </Link>
    </aside>
  );
};

export default Sidebar;
