import React from 'react';
import {
  Layers,
  PlusCircle,
  BarChart3,
  Trophy,
  Award,
  BookOpen,
  Compass,
  X
} from 'lucide-react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  examsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  examsCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: AppTab; label: string; icon: any; count?: number }[] = [
    { id: 'exams', label: 'Exam Hub', icon: Layers, count: examsCount },
    { id: 'builder', label: 'Create Exam', icon: PlusCircle },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'milestones', label: 'Milestones', icon: Award },
    { id: 'how-to', label: 'How To', icon: BookOpen },
  ];

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div 
          onClick={() => handleSelectTab('exams')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-yellow-400 p-0.5 shadow-md shadow-orange-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-orange-400">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-zinc-900 dark:text-white text-base tracking-tight leading-tight">
              CELE Engine
            </div>
            <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Board Hub
            </div>
          </div>
        </div>

        {/* Close button on mobile */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 dark:border-orange-500/40 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive
                    ? 'bg-orange-500 text-white dark:text-black'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer info */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-500 text-center font-medium">
        <span>V1.0 Created by DFBuildsStuffs</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
