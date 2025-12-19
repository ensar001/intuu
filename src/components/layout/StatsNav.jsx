const StatsNav = ({ onNavigate }) => {
  const statsItems = [
    { id: 'learning-level', label: 'Learning Level' },
    { id: 'words-mastered', label: 'Words Mastered' },
    { id: 'weekly-goals', label: 'Weekly Goals' },
  ];

  return (
    <nav className="w-64 space-y-2 fixed right-24 top-52 bg-white p-4 rounded-lg border border-slate-200">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-4">Statistics</h3>
      {statsItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:shadow-educational hover:scale-105 transition-all duration-200"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default StatsNav;
