import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  X,
  HelpCircle,
  AlertTriangle,
  Send,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exam } from '../types';
import { CELE_SUBJECTS } from '../lib/constants';
import { LatexRenderer } from '../lib/katex-renderer';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ExamSimulatorProps {
  exam: Exam;
  onClose: () => void;
  onOpenLightbox: (url: string, title?: string) => void;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({ exam, onClose, onOpenLightbox }) => {
  const { currentUser, awardXp } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>((exam.timeLimit || 120) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectChoice = (label: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: label }));
  };

  const toggleFlag = (idx: number) => {
    setFlaggedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const togglePeekSolution = (idx: number) => {
    setRevealedSolutions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const resultStats = useMemo(() => {
    let correctCount = 0;
    exam.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    const percentage = Math.round((correctCount / exam.questions.length) * 100);
    const isPassed = percentage >= (exam.passingScore || 70);
    return { correctCount, percentage, isPassed };
  }, [exam, selectedAnswers]);

  const handleSubmitExam = async () => {
    setIsSubmitted(true);
    const totalTimeSpent = (exam.timeLimit * 60) - secondsLeft;

    if (resultStats.isPassed) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#22c55e', '#ffffff'],
      });
    }

    if (currentUser) {
      try {
        await api.recordAttempt({
          examId: exam.id,
          examTitle: exam.title,
          subject: exam.subject,
          userId: currentUser.id,
          userName: currentUser.name,
          score: resultStats.correctCount,
          totalQuestions: exam.questions.length,
          percentage: resultStats.percentage,
          passed: resultStats.isPassed,
          timeSpentSeconds: totalTimeSpent,
          userAnswers: selectedAnswers,
        });
        await awardXp(
          Math.round(100 + resultStats.percentage * 1.5 + (resultStats.isPassed ? 50 : 0)),
          'Completed CELE Exam'
        );
      } catch (e) {
        console.error('Failed to record attempt:', e);
      }
    }
  };

  const handleExitClick = () => {
    if (isSubmitted) {
      onClose();
    } else {
      setShowExitModal(true);
    }
  };

  const handleConfirmSubmitUnfinished = async () => {
    setShowExitModal(false);
    await handleSubmitExam();
  };

  const handleConfirmAbort = () => {
    setShowExitModal(false);
    onClose();
  };

  const currentQ = exam.questions[currentIndex];
  const subjectMeta = CELE_SUBJECTS[exam.subject] || CELE_SUBJECTS.SEC;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in">
      <div className="w-full max-w-6xl h-full max-h-[96vh] rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden relative">
        {/* TOP BAR */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${subjectMeta.badgeBg} ${subjectMeta.badgeBorder} ${subjectMeta.badgeText}`}>
              {subjectMeta.name}
            </span>
            <h2 className="font-extrabold text-zinc-900 dark:text-white text-sm sm:text-base truncate max-w-md">
              {exam.title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`flex items-center gap-1.5 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border ${
              secondsLeft < 300
                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 animate-pulse'
                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-orange-600 dark:text-orange-400'
            }`}>
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>

            {!isSubmitted && (
              <button
                onClick={() => setIsStudyMode(!isStudyMode)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isStudyMode
                    ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-400'
                    : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Study Mode</span>
              </button>
            )}

            {!isSubmitted ? (
              <button
                onClick={() => {
                  if (window.confirm('Submit your exam and calculate final board assessment score?')) {
                    handleSubmitExam();
                  }
                }}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                Submit Exam
              </button>
            ) : (
              <span className="text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-xl border border-orange-500/30">
                Reviewing
              </span>
            )}

            <button
              onClick={handleExitClick}
              className="p-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition"
              title="Exit Exam"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Question & Choices */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
            {isSubmitted && (
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in ${
                resultStats.isPassed
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-600 text-red-900 dark:text-red-200'
              }`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Result
                    </span>
                  </div>
                  <h3 className="text-xl font-black">
                    {resultStats.percentage}% — {resultStats.isPassed ? 'PASSED' : 'NEEDS PRACTICE'}
                  </h3>
                  <p className="text-xs opacity-90">
                    {resultStats.correctCount} of {exam.questions.length} items correct (Passing rate: {exam.passingScore}%)
                  </p>
                </div>

                <button
                  onClick={() => setRevealedSolutions(prev => ({ ...prev, [currentIndex]: true }))}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 font-bold text-xs rounded-xl shadow-sm"
                >
                  View Solution
                </button>
              </div>
            )}

            {/* Question Info Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-black text-zinc-900 dark:text-white text-base">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs text-zinc-400">
                  of {exam.questions.length}
                </span>
              </div>

              <button
                onClick={() => toggleFlag(currentIndex)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                  flaggedQuestions[currentIndex]
                    ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-400'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentIndex] ? 'fill-current' : ''}`} />
                <span>{flaggedQuestions[currentIndex] ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">
              <LatexRenderer text={currentQ.questionText} />
            </div>

            {/* Question Figure */}
            {currentQ.questionFigureUrl && (
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                <img
                  src={currentQ.questionFigureUrl}
                  alt="Figure"
                  onClick={() => onOpenLightbox(currentQ.questionFigureUrl!, `Question #${currentIndex + 1} Figure`)}
                  className="max-h-60 max-w-full object-contain mx-auto rounded-lg cursor-pointer hover:border-orange-500"
                />
              </div>
            )}

            {/* Choices */}
            <div className="space-y-2.5 pt-1">
              {currentQ.choices.map(c => {
                const isSelected = selectedAnswers[currentIndex] === c.label;
                const isCorrect = c.label === currentQ.correctAnswer;

                let choiceStyle = 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 text-zinc-900 dark:text-zinc-100';
                if (isSubmitted) {
                  if (isCorrect) {
                    choiceStyle = 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500';
                  } else if (isSelected && !isCorrect) {
                    choiceStyle = 'bg-red-50 dark:bg-red-500/20 border-red-500 text-red-900 dark:text-red-200 line-through';
                  }
                } else if (isSelected) {
                  choiceStyle = 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500 ring-1 ring-orange-500 text-orange-950 dark:text-white font-semibold';
                }

                return (
                  <div
                    key={c.label}
                    onClick={() => handleSelectChoice(c.label)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${choiceStyle}`}
                  >
                    <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {c.label}
                    </span>

                    <div className="flex-1 text-xs sm:text-sm pt-0.5">
                      <LatexRenderer text={c.text} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Derivation / Solution */}
            {(isSubmitted || isStudyMode || revealedSolutions[currentIndex]) && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-yellow-500/40 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-yellow-700 dark:text-yellow-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Solution & Derivation</span>
                  </div>
                  <span className="bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/30">
                    Correct Answer: {currentQ.correctAnswer}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  <LatexRenderer text={currentQ.solutionText || 'No derivation provided.'} />
                </div>

                {currentQ.solutionFigureUrl && (
                  <div className="p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center">
                    <img
                      src={currentQ.solutionFigureUrl}
                      alt="Solution Figure"
                      onClick={() => onOpenLightbox(currentQ.solutionFigureUrl!, `Question #${currentIndex + 1} Solution Figure`)}
                      className="max-h-52 max-w-full object-contain mx-auto rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {!isSubmitted && !isStudyMode && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => togglePeekSolution(currentIndex)}
                  className="text-xs text-orange-500 hover:underline font-bold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{revealedSolutions[currentIndex] ? 'Hide Derivation' : 'Peek Solution (Study Mode)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Question Matrix */}
          <div className="w-full lg:w-64 bg-zinc-50 dark:bg-zinc-900 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400">
                <span>Palette</span>
                <span className="font-mono">
                  {Object.keys(selectedAnswers).length} / {exam.questions.length}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-h-52 lg:max-h-[50vh] overflow-y-auto pr-1">
                {exam.questions.map((q, qIdx) => {
                  const isAnswered = selectedAnswers[qIdx] !== undefined;
                  const isCurrent = currentIndex === qIdx;
                  const isFlagged = flaggedQuestions[qIdx];

                  let btnBg = 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300';
                  if (isSubmitted) {
                    const isCorrect = selectedAnswers[qIdx] === q.correctAnswer;
                    btnBg = isCorrect
                      ? 'bg-emerald-500 text-white font-extrabold'
                      : 'bg-red-500 text-white font-extrabold';
                  } else if (isAnswered) {
                    btnBg = 'bg-orange-500 text-white font-extrabold';
                  }

                  return (
                    <button
                      key={qIdx}
                      onClick={() => setCurrentIndex(qIdx)}
                      className={`h-8 rounded-lg text-xs font-bold border transition flex items-center justify-center relative ${btnBg} ${
                        isCurrent ? 'ring-2 ring-orange-500 ring-offset-1' : ''
                      }`}
                    >
                      {qIdx + 1}
                      {isFlagged && (
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prev/Next */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="flex-1 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl"
                >
                  Prev
                </button>
                <button
                  disabled={currentIndex === exam.questions.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-30 text-white font-bold text-xs rounded-xl"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                  Exit Current Exam?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  You have answered {Object.keys(selectedAnswers).length} of {exam.questions.length} questions.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
              Would you like to <strong>submit your unfinished exam</strong> to calculate your score and save your progress to your account history, or <strong>abort the exam</strong> without recording any score?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmSubmitUnfinished}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Unfinished Exam</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAbort}
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Abort Exam (Discard Attempt)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="w-full py-2 px-4 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold text-xs rounded-xl transition"
              >
                Cancel & Resume Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
