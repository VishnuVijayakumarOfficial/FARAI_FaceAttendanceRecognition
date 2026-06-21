import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Bell, Search, User, Sun, Moon } from 'lucide-react';

const TopBar = ({ title }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="h-20 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 font-outfit">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{title || 'Dashboard'}</h1>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none w-64 transition-all dark:text-slate-200"
          />
        </div>

        <button onClick={toggleTheme} className="relative p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          {isDarkMode ? <Sun size={20} className="text-slate-400 dark:text-slate-300" /> : <Moon size={20} className="text-slate-500" />}
        </button>

        <button className="relative p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Bell size={20} className="text-slate-500 dark:text-slate-400" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-slate-100 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.email?.split('@')[0] || 'Admin'}</p>
            <p className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <User size={20} className="text-slate-400 dark:text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
