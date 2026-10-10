import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Attempt, SubjectCode } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CELE_SUBJECTS } from '../lib/constants';

interface DashboardViewProps {
  onTakeExamById: (examId: string) => void;
  onExploreExams: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onTakeExamById, onExploreExams }) => {
  const { currentUser } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAttempts() {
      setIsLoading(true);
      try {
        const data = await api.getAttempts();
        setAttempts(data);
      } catch (err) {
        console.error('Failed to load attempts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAttempts();
  }, []);

  const userAttempts = useMemo(() => {
    if (!currentUser) return attempts;
    return attempts.filter(a => a.userId === currentUser.id);
  }, [attempts, currentUser]);

  const stats = useMemo(() => {
    const total = userAttempts.length;
    if (total === 0) {
      return {
        totalExams: 0,
        totalQuestions: 0,
        avgScore: 0,
        passRate: 0,
        bySubject: {
          SEC: { count: 0, avg: 0 },
          HPGE: { count: 0, avg: 0 },
          MSTE: { count: 0, avg: 0 },
        },
      };
    }

    const totalQuestions = userAttempts.reduce((acc, a) => acc + (a.totalQuestions || 0), 0);
    const totalPercentage = userAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
    const passedCount = userAttempts.filter(a => a.passed).length;

    const bySubject: Record<SubjectCode, { count: number; sum: number }> = {
      SEC: { count: 0, sum: 0 },
      HPGE: { count: 0, sum: 0 },
      MSTE: { count: 0, sum: 0 },
    };

    userAttempts.forEach(a => {
      if (a.subject && bySubject[a.subject]) {
        bySubject[a.subject].count++;
        bySubject[a.subject].sum += a.percentage || 0;
      }
    });

    return {
      totalExams: total,
      totalQuestions,
      avgScore: Math.round(totalPercentage / total),
      passRate: Math.round((passedCount / total) * 100),
      bySubject: {
        SEC: {
          count: bySubject.SEC.count,
          avg: bySubject.SEC.count > 0 ? Math.round(bySubject.SEC.sum / bySubject.SEC.count) : 0,
        },
        HPGE: {
          count: bySubject.HPGE.count,
          avg: bySubject.HPGE.count > 0 ? Math.round(bySubject.HPGE.sum / bySubject.HPGE.count) : 0,
        },
        MSTE: {
          count: bySubject.MSTE.count,
          avg: bySubject.MSTE.count > 0 ? Math.round(bySubject.MSTE.sum / bySubject.MSTE.count) : 0,
        },
      },
    };
  }, [userAttempts]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Accuracy</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
            {stats.avgScore}%
          </div>
          <div className="text-[11px] text-zinc-500">
            {stats.avgScore >= 70 ? 'Passing Range' : 'Below Passing'}
          </div>
        </div>

        {/* Total Questions Solved */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Items Answered</span>
            <BookOpen className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-3xl font-black text-yellow-600 dark:text-yellow-400 mb-1">
            {stats.totalQuestions}
          </div>
          <div className="text-[11px] text-zinc-500">
            Across {stats.totalExams} tests
          </div>
        </div>

        {/* Pass Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
            {stats.passRate}%
          </div>
          <div className="text-[11px] text-zinc-500">
            Passing benchmark: 70%
          </div>
        </div>

        {/* Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span className="font-bold uppercase tracking-wider">Daily Streak</span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mb-1">
            {currentUser?.streakDays || 1}d
          </div>
          <div className="text-[11px] text-zinc-500">
            Consecutive study
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Subject Mastery</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* SEC */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                SEC
              </span>
              <span className="text-xs font-mono font-bold text-zinc-500">
                {stats.bySubject.SEC.count} Tests
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Structural & Construction</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.bySubject.SEC.avg}%</span>
                <span className="text-[11px] text-zinc-500">Pass: 70%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                style={{ width: `${Math.min(stats.bySubject.SEC.avg, 100)}%` }}
              />
            </div>
          </div>

          {/* HPGE */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
                HPGE
              </span>
              <span className="text-xs font-mono font-bold text-zinc-500">
                {stats.bySubject.HPGE.count} Tests
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Hydraulics & Geotechnical</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.bySubject.HPGE.avg}%</span>
                <span className="text-[11px] text-zinc-500">Pass: 70%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                style={{ width: `${Math.min(stats.bySubject.HPGE.avg, 100)}%` }}
              />
            </div>
          </div>

          {/* MSTE */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                MSTE
              </span>
              <span className="text-xs font-mono font-bold text-zinc-500">
                {stats.bySubject.MSTE.count} Tests
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Math & Surveying</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.bySubject.MSTE.avg}%</span>
                <span className="text-[11px] text-zinc-500">Pass: 70%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                style={{ width: `${Math.min(stats.bySubject.MSTE.avg, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attempts History Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Examination History</h3>
          <button
            onClick={onExploreExams}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition flex items-center gap-1"
          >
            <span>Exams</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {userAttempts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <p>No recorded exam attempts yet.</p>
            <button
              onClick={onExploreExams}
              className="px-4 py-2 bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow transition"
            >
              Start Practice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Exam</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {userAttempts.slice(0, 8).map(att => {
                  const subMeta = CELE_SUBJECTS[att.subject] || CELE_SUBJECTS.SEC;
                  return (
                    <tr key={att.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white max-w-xs truncate">
                        {att.examTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${subMeta.badgeBg} ${subMeta.badgeBorder} ${subMeta.badgeText}`}>
                          {att.subject}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {att.score} / {att.totalQuestions}
                      </td>
                      <td className="py-3.5 px-4 font-black">
                        <span className={att.percentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}>
                          {att.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          att.passed
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                        }`}>
                          {att.passed ? 'PASSED' : 'RETRY'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                        {new Date(att.completedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onTakeExamById(att.examId)}
                          className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-orange-500 hover:text-white border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-[11px] font-bold transition"
                        >
                          Retake
                        </button>
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
