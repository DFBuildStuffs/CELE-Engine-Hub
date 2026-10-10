import React, { useState } from 'react';
import {
  Award,
  Flame,
  CheckCircle2,
  Lock,
  Building2,
  Waves,
  Ruler,
  Target,
  FileUp,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ALL_BADGES } from '../lib/constants';
import { useAuth } from '../context/AuthContext';

export const GamificationView: React.FC = () => {
  const { currentUser, incrementStreak, awardXp } = useAuth();
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const unlockedIds = currentUser?.unlockedBadges || [];

  const handleCheckIn = async () => {
    setJustCheckedIn(true);
    await incrementStreak();
    await awardXp(50, 'Daily Study Streak');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f97316', '#eab308', '#ffffff'],
    });
    setTimeout(() => setJustCheckedIn(false), 3000);
  };

  const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const iconClass = `w-6 h-6 ${isUnlocked ? 'text-white dark:text-black' : 'text-zinc-400 dark:text-zinc-500'}`;
    switch (iconName) {
      case 'Flame': return <Flame className={iconClass} />;
      case 'Building2': return <Building2 className={iconClass} />;
      case 'Waves': return <Waves className={iconClass} />;
      case 'Ruler': return <Ruler className={iconClass} />;
      case 'Target': return <Target className={iconClass} />;
      case 'FileUp': return <FileUp className={iconClass} />;
      case 'CheckCircle2': return <CheckCircle2 className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  const examsTaken = currentUser?.examsTaken || 0;
  const streakDays = currentUser?.streakDays || 1;
  const xp = currentUser?.xp || 0;

  const milestones = [
    {
      title: 'First Mock Exam Completed',
      target: 1,
      current: Math.min(examsTaken, 1),
      desc: 'Complete 1 full exam',
      completed: examsTaken >= 1,
    },
    {
      title: '5 Exams Conquered',
      target: 5,
      current: Math.min(examsTaken, 5),
      desc: 'Master SEC, HPGE & MSTE',
      completed: examsTaken >= 5,
    },
    {
      title: '3-Day Study Streak',
      target: 3,
      current: Math.min(streakDays, 3),
      desc: 'Practice 3 consecutive days',
      completed: streakDays >= 3,
    },
    {
      title: '2,000 XP Milestone',
      target: 2000,
      current: Math.min(xp, 2000),
      desc: 'Earn points through accuracy and authoring',
      completed: xp >= 2000,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Daily Streak Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white">
              {streakDays}-Day Study Streak
            </h2>
            <span className="text-xs text-zinc-500 font-medium">Daily practice habit</span>
          </div>
        </div>

        <button
          onClick={handleCheckIn}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95 ${
            justCheckedIn
              ? 'bg-emerald-500 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{justCheckedIn ? 'Logged Today (+50 XP)' : 'Daily Check-In (+50 XP)'}</span>
        </button>
      </div>

      {/* Badges Gallery */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">Achievements & Badges</h2>
          <span className="text-xs font-mono font-bold text-zinc-500">
            {unlockedIds.length} / {ALL_BADGES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ALL_BADGES.map(badge => {
            const isUnlocked = unlockedIds.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-3xl border transition flex items-start gap-3.5 ${
                  isUnlocked
                    ? 'bg-white dark:bg-zinc-950 border-orange-500/30 dark:border-orange-500/40 shadow-sm'
                    : 'bg-zinc-50/60 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-900 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUnlocked
                    ? `bg-gradient-to-tr ${badge.unlockedColor}`
                    : 'bg-zinc-200 dark:bg-zinc-900'
                }`}>
                  {renderBadgeIcon(badge.icon, isUnlocked)}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-extrabold text-zinc-900 dark:text-white text-xs truncate">
                      {badge.title}
                    </h3>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones Progress */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">Milestones</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {milestones.map((m, idx) => {
            const pct = Math.round((m.current / m.target) * 100);

            return (
              <div key={idx} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white text-xs">{m.title}</span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {m.current} / {m.target}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      m.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
