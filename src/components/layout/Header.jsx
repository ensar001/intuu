import { Menu, Search, Globe } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { GermanFlag, USFlag } from '../ui/flags';

const Header = ({ setIsSidebarOpen, interfaceLanguage, setInterfaceLanguage }) => {
  const location = useLocation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const interfaceLanguages = [
    { code: 'en', name: 'English', flag: <USFlag /> },
    { code: 'de', name: 'Deutsch', flag: <GermanFlag /> },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  ];

  const currentInterfaceLang = interfaceLanguages.find(lang => lang.code === interfaceLanguage) || interfaceLanguages[0];

  const navLabels = {
    '/dashboard': 'Dashboard',
    '/text-analyzer': 'Text Analyzer',
    '/language-tutor': 'Language Tutor',
    '/flashcards': 'Flashcards',
    '/settings': 'Settings',
    '/courses/listening': 'Listening Practice',
    '/courses/reading': 'Reading Practice',
    '/courses/writing': 'Writing Practice',
    '/courses/speaking': 'Speaking Practice',
    '/courses/grammar': 'Grammar Awareness',
  };

  return (
    <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-800 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">I</div>
          <span>Intuu</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
         {/* Interface Language Selector */}
         <div className="relative">
           <button 
             onClick={() => setShowLanguageMenu(!showLanguageMenu)}
             className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl hover:shadow-lg transition-all hover:scale-105"
             title="Change interface language"
           >
             {currentInterfaceLang.flag}
           </button>

           {showLanguageMenu && (
             <>
               <div 
                 className="fixed inset-0 z-40" 
                 onClick={() => setShowLanguageMenu(false)}
               />
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                 {interfaceLanguages.map((lang) => (
                   <button
                     key={lang.code}
                     onClick={() => {
                       setInterfaceLanguage(lang.code);
                       setShowLanguageMenu(false);
                     }}
                     className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                       interfaceLanguage === lang.code ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                     }`}
                   >
                     <span className="text-2xl">{lang.flag}</span>
                     <span className="font-medium">{lang.name}</span>
                     {interfaceLanguage === lang.code && (
                       <span className="ml-auto text-indigo-600">✓</span>
                     )}
                   </button>
                 ))}
               </div>
             </>
           )}
         </div>

         <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm text-slate-600 mr-2">
           <Search size={16} />
           <span className="opacity-50">Quick search...</span>
         </div>
      </div>
    </header>
  );
};

export default Header;
