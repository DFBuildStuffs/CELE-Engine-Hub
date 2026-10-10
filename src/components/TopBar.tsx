import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Flame,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppTab } from '../types';

interface TopBarProps {
  activeTab: AppTab;
  onOpenMobileSidebar: () => void;
  onOpenAuthModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenAuthModal,
}) => {
  const { currentUser, incrementStreak } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [streakClicked, setStreakClicked] = useState(false);

  const getPageTitle = (tab: AppTab) => {
    switch (tab) {
      case 'exams': return 'Exam Hub';
      case 'builder': return 'Create Exam';
      case 'dashboard': return 'Dashboard';
      case 'leaderboard': return 'Leaderboard';
      case 'milestones': return 'Milestones';
      case 'how-to': return 'How To';
      default: return 'Exam Hub';
    }
  };

  const handleStreakClick = async () => {
    setStreakClicked(true);
    await incrementStreak();
    setTimeout(() => setStreakClicked(false), 2000);
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile hamburger & Clean Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="font-extrabold text-zinc-900 dark:text-white text-lg tracking-tight">
            {getPageTitle(activeTab)}
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Daily Streak */}
          <button
            onClick={handleStreakClick}
            title="Click to log study activity"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              streakClicked
                ? 'bg-orange-500 text-white dark:text-black border-orange-400 scale-105'
                : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-orange-500/50'
            }`}
          >
            <Flame className={`w-4 h-4 ${streakClicked ? 'fill-current animate-bounce' : 'text-orange-500 fill-orange-500'}`} />
            <span>{currentUser?.streakDays || 1}d Streak</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-orange-500" />
            )}
          </button>

          {/* User Profile Pill */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 transition group"
          >
            {currentUser ? (
              <>
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-950" />
                </div>
                <div className="text-left hidden sm:block max-w-[120px] truncate">
                  <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition truncate">
                    {currentUser.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {currentUser.xp} XP
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500">
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
