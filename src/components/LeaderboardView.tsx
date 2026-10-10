import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LeaderboardView: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'xp' | 'avgScore' | 'examsTaken'>('xp');

  useEffect(() => {
    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        const data = await api.getLeaderboard();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'avgScore') return (b.avgScore || 0) - (a.avgScore || 0);
    if (sortBy === 'examsTaken') return (b.examsTaken || 0) - (a.examsTaken || 0);
    return (b.xp || 0) - (a.xp || 0);
  });

  const top1 = sortedUsers[0];
  const top2 = sortedUsers[1];
  const top3 = sortedUsers[2];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Sort Filters */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
            Candidate Standings
          </h2>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSortBy('xp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              sortBy === 'xp'
                ? 'bg-orange-500 text-white dark:text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            XP Points
          </button>
          <button
            onClick={() => setSortBy('avgScore')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              sortBy === 'avgScore'
                ? 'bg-orange-500 text-white dark:text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Average Score
          </button>
          <button
            onClick={() => setSortBy('examsTaken')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              sortBy === 'examsTaken'
                ? 'bg-orange-500 text-white dark:text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Exams Taken
          </button>
        </div>
      </div>

      {/* Podium (Top 3) */}
      {sortedUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-3 pb-1">
          {/* #2 Silver */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-2 relative order-1 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white font-black text-xs flex items-center justify-center mx-auto absolute -top-3.5 left-1/2 -translate-x-1/2 shadow">
              2
            </div>
            <img
              src={top2.avatar}
              alt={top2.name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-600 mx-auto shadow-sm"
            />
            <div className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">{top2.name}</div>
            <div className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
              {sortBy === 'avgScore' ? `${top2.avgScore}%` : `${top2.xp} XP`}
            </div>
          </div>

          {/* #1 Gold */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border-2 border-yellow-500/70 text-center space-y-2 relative order-2 shadow-md">
            <div className="w-9 h-9 rounded-full bg-yellow-500 text-black font-black text-sm flex items-center justify-center mx-auto absolute -top-4.5 left-1/2 -translate-x-1/2 shadow">
              👑
            </div>
            <img
              src={top1.avatar}
              alt={top1.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-900 border-2 border-yellow-400 mx-auto shadow-md"
            />
            <div className="font-extrabold text-zinc-900 dark:text-white text-sm sm:text-base truncate">{top1.name}</div>
            <div className="font-mono font-black text-sm text-yellow-600 dark:text-yellow-400">
              {sortBy === 'avgScore' ? `${top1.avgScore}% Avg` : `${top1.xp} XP`}
            </div>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-bold">
              Rank 1 Topnotcher
            </span>
          </div>

          {/* #3 Bronze */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-2 relative order-3 shadow-sm">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center mx-auto absolute -top-3.5 left-1/2 -translate-x-1/2 shadow">
              3
            </div>
            <img
              src={top3.avatar}
              alt={top3.name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-900 border-2 border-amber-600 mx-auto shadow-sm"
            />
            <div className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">{top3.name}</div>
            <div className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
              {sortBy === 'avgScore' ? `${top3.avgScore}%` : `${top3.xp} XP`}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Standings</h3>

        {sortedUsers.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2 opacity-60" />
            <p className="font-bold text-zinc-700 dark:text-zinc-300">No candidate records yet.</p>
            <p className="text-[11px] text-zinc-500 mt-1">Sign in and complete an exam to claim the #1 spot!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Streak</th>
                  <th className="py-3 px-4">Exams</th>
                  <th className="py-3 px-4">Avg Score</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {sortedUsers.map((u, idx) => {
                  const isMe = currentUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className={`transition ${
                        isMe
                          ? 'bg-orange-500/10 font-bold border-l-4 border-l-orange-500'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-black">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                          />
                          <div className="truncate">
                            <span className="font-bold text-zinc-900 dark:text-white text-xs block">
                              {u.name} {isMe && '(You)'}
                            </span>
                            <span className="text-[10px] text-zinc-400 truncate block">
                              {u.title || u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-orange-600 dark:text-orange-400">
                        {u.streakDays || 1}d
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {u.examsTaken || 0}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={(u.avgScore || 0) >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}>
                          {u.avgScore || 0}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                        {u.xp || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
