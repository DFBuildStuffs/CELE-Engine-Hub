import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Play,
  Download,
  Trash2,
  Copy,
  Clock,
  Layers,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Exam, SubjectCode } from '../types';
import { CELE_SUBJECTS } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { LatexRenderer } from '../lib/katex-renderer';

interface ExamsDirectoryProps {
  exams: Exam[];
  onTakeExam: (exam: Exam) => void;
  onEditExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onExportExam: (exam: Exam) => void;
  onCreateNew: () => void;
  onOpenLightbox: (url: string, title?: string) => void;
}

export const ExamsDirectory: React.FC<ExamsDirectoryProps> = ({
  exams,
  onTakeExam,
  onEditExam,
  onDeleteExam,
  onExportExam,
  onCreateNew,
  onOpenLightbox,
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'ALL' | SubjectCode>('ALL');
  const [filterOwner, setFilterOwner] = useState<'all' | 'mine'>('all');
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      if (selectedSubject !== 'ALL' && exam.subject !== selectedSubject) return false;
      if (filterOwner === 'mine' && currentUser && exam.authorId !== currentUser.id) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exam.title.toLowerCase().includes(q);
        const matchesDesc = exam.description?.toLowerCase().includes(q) || false;
        const matchesAuthor = exam.authorName?.toLowerCase().includes(q) || false;
        const matchesQuestions = exam.questions.some(item =>
          item.questionText.toLowerCase().includes(q) ||
          (item.solutionText && item.solutionText.toLowerCase().includes(q))
        );
        return matchesTitle || matchesDesc || matchesAuthor || matchesQuestions;
      }
      return true;
    });
  }, [exams, selectedSubject, filterOwner, searchQuery, currentUser]);

  const totalQuestions = useMemo(() => {
    return exams.reduce((acc, e) => acc + (e.questions?.length || 0), 0);
  }, [exams]);

  const totalFigures = useMemo(() => {
    return exams.reduce((acc, e) => {
      return acc + (e.questions?.filter(q => q.questionFigureUrl || q.solutionFigureUrl).length || 0);
    }, 0);
  }, [exams]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Aggregate Counters */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-6 text-left">
          <div>
            <span className="block text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Exams</span>
            <span className="text-xl font-black text-zinc-900 dark:text-white">{exams.length}</span>
          </div>
          <div>
            <span className="block text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Questions</span>
            <span className="text-xl font-black text-orange-600 dark:text-orange-400">{totalQuestions}</span>
          </div>
          <div>
            <span className="block text-zinc-500 text-[11px] font-bold uppercase tracking-wider">Figures</span>
            <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">{totalFigures}</span>
          </div>
        </div>

        <button
          onClick={onCreateNew}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Exam</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search problems, formulas, topics, or authors..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedSubject === 'ALL'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedSubject('SEC')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedSubject === 'SEC'
                ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/50'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            SEC
          </button>
          <button
            onClick={() => setSelectedSubject('HPGE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedSubject === 'HPGE'
                ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/50'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            HPGE
          </button>
          <button
            onClick={() => setSelectedSubject('MSTE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedSubject === 'MSTE'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/50'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            MSTE
          </button>
        </div>

        {/* Ownership Toggle */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setFilterOwner('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filterOwner === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterOwner('mine')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              filterOwner === 'mine'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            Mine
          </button>
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">No Exams Found</h3>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow transition"
          >
            Create First Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map(exam => {
            const subjectMeta = CELE_SUBJECTS[exam.subject] || CELE_SUBJECTS.SEC;
            const figCount = exam.questions.filter(q => q.questionFigureUrl || q.solutionFigureUrl).length;
            const isExpanded = expandedExamId === exam.id;
            const isAuthor = currentUser && exam.authorId === currentUser.id;

            return (
              <div
                key={exam.id}
                className="rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group relative"
              >
                <div className="space-y-3.5">
                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${subjectMeta.badgeBg} ${subjectMeta.badgeBorder} ${subjectMeta.badgeText}`}>
                      {subjectMeta.name}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {exam.createdAt}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition leading-snug">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-center">
                    <div>
                      <span className="block font-black text-zinc-800 dark:text-zinc-200 text-sm">{exam.questions.length}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Items</span>
                    </div>
                    <div className="border-x border-zinc-200 dark:border-zinc-800">
                      <span className="block font-black text-orange-600 dark:text-orange-400 text-sm flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.timeLimit}m
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Time</span>
                    </div>
                    <div>
                      <span className="block font-black text-yellow-600 dark:text-yellow-400 text-sm flex items-center justify-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {figCount}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Figures</span>
                    </div>
                  </div>

                  {/* Author & Expand */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">
                      {exam.authorName || 'Review Contributor'}
                    </span>

                    <button
                      onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                      className="text-[11px] text-zinc-500 hover:text-orange-500 font-bold flex items-center gap-1 transition"
                    >
                      <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Question Drawer */}
                  {isExpanded && (
                    <div className="mt-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 max-h-56 overflow-y-auto text-xs animate-in fade-in">
                      {exam.questions.map((q, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-orange-500">#{q.order || idx + 1}</span>
                            <span className="text-zinc-400 font-mono text-[10px]">Key: {q.correctAnswer}</span>
                          </div>
                          <div className="text-zinc-800 dark:text-zinc-200 text-xs">
                            <LatexRenderer text={q.questionText} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                  <button
                    onClick={() => onTakeExam(exam)}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Take Exam</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onExportExam(exam)}
                      className="flex-1 py-1.5 px-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={() => onEditExam(exam)}
                      title="Clone/Edit"
                      className="p-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-orange-500" />
                    </button>

                    {(isAuthor || currentUser?.role === 'admin') && (
                      <button
                        onClick={() => onDeleteExam(exam.id)}
                        title="Delete"
                        className="p-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-red-500/20 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-500 rounded-xl transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
