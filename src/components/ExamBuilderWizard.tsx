import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  FileUp,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Plus,
  Rocket,
  Search,
  Check,
  Sparkles,
  Shield,
  Pencil,
  Copy
} from 'lucide-react';
import { Exam, Question, SubjectCode } from '../types';
import { validateAndNormalizeCeleJson } from '../lib/schema-validator';
import { CELE_JSON_TEMPLATE_FULL_EXAM, CELE_JSON_TEMPLATE_SINGLE } from '../lib/constants';
import { LatexRenderer } from '../lib/katex-renderer';
import { useAuth } from '../context/AuthContext';

interface ExamBuilderWizardProps {
  initialExam?: Exam | null;
  mode?: 'create' | 'edit' | 'clone';
  onDeployExam: (exam: Exam) => Promise<void>;
  onCancel: () => void;
  onOpenLightbox: (url: string, title?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExamBuilderWizard: React.FC<ExamBuilderWizardProps> = ({
  initialExam,
  mode = 'create',
  onDeployExam,
  onCancel,
  onOpenLightbox,
  showToast,
}) => {
  const { currentUser, awardXp } = useAuth();

  const isAuthor = Boolean(currentUser && initialExam?.authorId === currentUser.id);
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  // Strict ownership enforcement:
  // If user attempted 'edit' on an exam created by another user, force 'clone' mode!
  const effectiveMode: 'create' | 'edit' | 'clone' = useMemo(() => {
    if (!initialExam) return 'create';
    if (mode === 'clone') return 'clone';
    if (mode === 'edit') {
      if (!canEdit) return 'clone';
      return 'edit';
    }
    return canEdit ? 'edit' : 'clone';
  }, [initialExam, mode, canEdit]);

  const [activeStep, setActiveStep] = useState<number>(initialExam ? 3 : 2);

  const [examMeta, setExamMeta] = useState({
    id: effectiveMode === 'clone' ? '' : (initialExam?.id || ''),
    title: effectiveMode === 'clone' && initialExam
      ? (initialExam.title.startsWith('Copy of ') ? initialExam.title : `Copy of ${initialExam.title}`)
      : (initialExam?.title || 'CE Board Mock Exam - SEC & HPGE'),
    subject: (initialExam?.subject || 'SEC') as SubjectCode,
    description: initialExam?.description || 'Board exam mock set focusing on NSCP 2015 reinforced concrete and soil mechanics.',
    timeLimit: initialExam?.timeLimit || 120,
    passingScore: initialExam?.passingScore || 70,
    solutionVisibility: (initialExam?.solutionVisibility || 'after_submission') as 'per_question' | 'after_submission',
  });

  const [rawJsonText, setRawJsonText] = useState('');
  const [questions, setQuestions] = useState<Question[]>(initialExam?.questions || []);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // Sync state if initialExam or effectiveMode changes
  useEffect(() => {
    if (initialExam) {
      const isCloning = effectiveMode === 'clone';
      setExamMeta({
        id: isCloning ? '' : (initialExam.id || ''),
        title: isCloning
          ? (initialExam.title.startsWith('Copy of ') ? initialExam.title : `Copy of ${initialExam.title}`)
          : (initialExam.title || ''),
        subject: (initialExam.subject || 'SEC') as SubjectCode,
        description: initialExam.description || '',
        timeLimit: initialExam.timeLimit || 120,
        passingScore: initialExam.passingScore || 70,
        solutionVisibility: (initialExam.solutionVisibility || 'after_submission') as 'per_question' | 'after_submission',
      });
      setQuestions(initialExam.questions || []);
      setActiveStep(3);
    }
  }, [initialExam, effectiveMode]);

  const [questionSearch, setQuestionSearch] = useState('');

  const processJson = (content: string) => {
    const res = validateAndNormalizeCeleJson(content);
    setValidationResult(res.validation);

    if (res.questions.length > 0) {
      setQuestions(res.questions);
      if (res.metadata.title) setExamMeta(prev => ({ ...prev, title: res.metadata.title! }));
      if (res.metadata.subject) setExamMeta(prev => ({ ...prev, subject: res.metadata.subject! }));
      if (res.metadata.timeLimit) setExamMeta(prev => ({ ...prev, timeLimit: res.metadata.timeLimit! }));
      if (res.metadata.passingScore) setExamMeta(prev => ({ ...prev, passingScore: res.metadata.passingScore! }));
      if (res.metadata.description) setExamMeta(prev => ({ ...prev, description: res.metadata.description! }));
      if (res.metadata.solutionVisibility) setExamMeta(prev => ({ ...prev, solutionVisibility: res.metadata.solutionVisibility! }));

      showToast(`Processed ${res.questions.length} questions.`, 'success');
    } else {
      showToast('Validation failed. Please review errors.', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      setRawJsonText(content);
      processJson(content);
    };
    reader.readAsText(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleAttachImage = async (qIndex: number, field: 'questionFigureUrl' | 'solutionFigureUrl', file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const updated = [...questions];
      updated[qIndex][field] = base64;
      setQuestions(updated);
      showToast(`Figure attached to Question #${qIndex + 1}!`, 'success');
    } catch {
      showToast('Failed to load image file.', 'error');
    }
  };

  const handleRemoveImage = (qIndex: number, field: 'questionFigureUrl' | 'solutionFigureUrl') => {
    const updated = [...questions];
    updated[qIndex][field] = null;
    setQuestions(updated);
    showToast('Figure removed.', 'info');
  };

  const handleAttachSampleSvg = (qIndex: number, type: 'beam' | 'soil') => {
    let svg = '';
    if (type === 'beam') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240" fill="none">
        <rect width="600" height="240" fill="#18181b"/>
        <line x1="80" y1="140" x2="520" y2="140" stroke="#f97316" stroke-width="8" stroke-linecap="round"/>
        <polygon points="80,144 65,175 95,175" fill="#eab308"/>
        <circle cx="520" cy="155" r="14" fill="#eab308"/>
        <path d="M 120 70 L 120 135" stroke="#38bdf8" stroke-width="3"/>
        <path d="M 240 70 L 240 135" stroke="#38bdf8" stroke-width="3"/>
        <path d="M 360 70 L 360 135" stroke="#38bdf8" stroke-width="3"/>
        <path d="M 480 70 L 480 135" stroke="#38bdf8" stroke-width="3"/>
        <line x1="120" y1="70" x2="480" y2="70" stroke="#38bdf8" stroke-width="3"/>
        <text x="300" y="55" fill="#facc15" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">w = 40 kN/m</text>
        <text x="300" y="205" fill="#a1a1aa" font-family="sans-serif" font-size="13" text-anchor="middle">Span L = 6.0 m</text>
      </svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240" fill="none">
        <rect width="600" height="240" fill="#18181b"/>
        <rect x="80" y="40" width="440" height="50" fill="#ca8a04" opacity="0.3"/>
        <rect x="80" y="90" width="440" height="60" fill="#ea580c" opacity="0.4"/>
        <rect x="80" y="150" width="440" height="60" fill="#713f12" opacity="0.6"/>
        <text x="100" y="70" fill="#fef08a" font-family="sans-serif" font-size="13">Layer 1: Sand (γ = 18 kN/m³)</text>
        <text x="100" y="125" fill="#fed7aa" font-family="sans-serif" font-size="13">Layer 2: Soft Clay (γ_sat = 19.5 kN/m³)</text>
        <text x="100" y="185" fill="#cbd5e1" font-family="sans-serif" font-size="13">Layer 3: Dense Sand / Bedrock</text>
      </svg>`;
    }
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    const updated = [...questions];
    updated[qIndex].questionFigureUrl = dataUrl;
    setQuestions(updated);
    showToast(`Attached diagram!`, 'success');
  };

  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    (updated[qIndex] as any)[field] = value;
    setQuestions(updated);
  };

  const handleChoiceChange = (qIndex: number, cIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].choices[cIndex].text = text;
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      order: questions.length + 1,
      questionText: 'A civil engineering problem statement ($f\'_c = 28\\text{ MPa}$)...',
      questionFigureUrl: null,
      choices: [
        { label: 'A', text: 'Option A' },
        { label: 'B', text: 'Option B' },
        { label: 'C', text: 'Option C' },
        { label: 'D', text: 'Option D' },
      ],
      correctAnswer: 'A',
      solutionText: 'Step-by-step derivation: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
      solutionFigureUrl: null,
    };
    setQuestions([...questions, newQ]);
    showToast('Added question.', 'info');
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      showToast('At least one question is required.', 'error');
      return;
    }
    const updated = questions.filter((_, idx) => idx !== qIndex).map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updated);
  };

  const handleDeploy = async () => {
    if (!examMeta.title.trim()) {
      showToast('Please provide an exam title.', 'error');
      setActiveStep(1);
      return;
    }
    if (questions.length === 0) {
      showToast('Please upload or add questions.', 'error');
      setActiveStep(2);
      return;
    }

    setIsDeploying(true);
    try {
      const isCloning = effectiveMode === 'clone';
      const isEditing = effectiveMode === 'edit';

      const examToDeploy: Exam = {
        id: isCloning || !examMeta.id ? ('cele-' + Date.now()) : examMeta.id,
        title: examMeta.title.trim(),
        subject: examMeta.subject,
        description: examMeta.description,
        timeLimit: Number(examMeta.timeLimit) || 120,
        passingScore: Number(examMeta.passingScore) || 70,
        solutionVisibility: examMeta.solutionVisibility || 'after_submission',
        createdAt: isEditing && initialExam?.createdAt ? initialExam.createdAt : new Date().toISOString().split('T')[0],
        authorId: isCloning ? (currentUser?.id || 'reviewer') : (initialExam?.authorId || currentUser?.id || 'reviewer'),
        authorName: isCloning ? (currentUser?.name || 'Review Contributor') : (initialExam?.authorName || currentUser?.name || 'Review Contributor'),
        questions,
      };

      await onDeployExam(examToDeploy);
      if (isCloning) {
        await awardXp(150, 'Cloning & Customizing CELE Exam');
        showToast('🎉 Cloned exam successfully deployed as your own copy!', 'success');
      } else if (isEditing) {
        showToast('🎉 Exam successfully updated in archive!', 'success');
      } else {
        await awardXp(200, 'Authoring CELE Exam');
        showToast('🎉 Exam successfully published and synced to Firebase Cloud!', 'success');
      }
    } catch {
      showToast('Failed to deploy exam.', 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!questionSearch.trim()) return questions;
    const q = questionSearch.toLowerCase();
    return questions.filter(
      item =>
        item.questionText.toLowerCase().includes(q) ||
        (item.solutionText && item.solutionText.toLowerCase().includes(q)) ||
        `#${item.order}`.includes(q)
    );
  }, [questions, questionSearch]);

  return (
    <div className="space-y-6">
      {/* Banner for Edit / Clone Mode */}
      {effectiveMode === 'edit' && (
        <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-zinc-900 dark:text-white">Editing Exam</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                You are updating your exam in place. Changes will be saved directly to the cloud repository.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs shrink-0">
            Author: You
          </span>
        </div>
      )}

      {effectiveMode === 'clone' && (
        <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-zinc-900 dark:text-white">Cloning Exam Mode</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {initialExam?.authorName
                  ? `Exams created by other authors (${initialExam.authorName}) cannot be edited directly. You are creating your own independent version.`
                  : 'You are creating an independent copy of this exam. The original version will remain unchanged.'}
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
            New Cloned Copy
          </span>
        </div>
      )}

      {/* Stepper Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white dark:text-black font-black flex items-center justify-center text-xs shadow-sm">
            {activeStep}
          </div>
          <h2 className="font-extrabold text-zinc-900 dark:text-white text-sm">
            {activeStep === 1 && 'Step 1: Exam Settings'}
            {activeStep === 2 && 'Step 2: Upload JSON'}
            {activeStep === 3 && `Step 3: Preview Questions & Figures (${questions.length} Items)`}
          </h2>
        </div>

        {/* Stepper Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeStep === 1
                ? 'bg-orange-500 text-white dark:text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            1. Settings
          </button>
          <button
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeStep === 2
                ? 'bg-orange-500 text-white dark:text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            2. Import
          </button>
          <button
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeStep === 3
                ? 'bg-orange-500 text-white dark:text-black shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            3. Preview ({questions.length})
          </button>

          {questions.length > 0 && (
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="ml-1 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{isDeploying ? 'Deploying...' : 'Deploy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: SETTINGS */}
      {activeStep === 1 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-3xl mx-auto space-y-5 animate-in fade-in">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">Exam Parameters</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Exam Title
              </label>
              <input
                type="text"
                value={examMeta.title}
                onChange={e => setExamMeta({ ...examMeta, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Subject Cluster
                </label>
                <select
                  value={examMeta.subject}
                  onChange={e => setExamMeta({ ...examMeta, subject: e.target.value as SubjectCode })}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="SEC">SEC (Structural)</option>
                  <option value="HPGE">HPGE (Geotech)</option>
                  <option value="MSTE">MSTE (Surveying)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  max="360"
                  value={examMeta.timeLimit}
                  onChange={e => setExamMeta({ ...examMeta, timeLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={examMeta.passingScore}
                  onChange={e => setExamMeta({ ...examMeta, passingScore: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={examMeta.description}
                onChange={e => setExamMeta({ ...examMeta, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Solution Display Mode Parameter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Solution & Derivation Display Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setExamMeta({ ...examMeta, solutionVisibility: 'after_submission' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    examMeta.solutionVisibility === 'after_submission'
                      ? 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500 ring-2 ring-orange-500'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className={`w-4 h-4 shrink-0 ${examMeta.solutionVisibility === 'after_submission' ? 'text-orange-500' : 'text-zinc-400'}`} />
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                      After Submitting Whole Exam
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    Standard Board Exam Mode. Full derivations and correct answer keys remain sealed until the exam is officially submitted.
                  </p>
                </div>

                <div
                  onClick={() => setExamMeta({ ...examMeta, solutionVisibility: 'per_question' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    examMeta.solutionVisibility === 'per_question'
                      ? 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500 ring-2 ring-orange-500'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className={`w-4 h-4 shrink-0 ${examMeta.solutionVisibility === 'per_question' ? 'text-orange-500' : 'text-zinc-400'}`} />
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                      After Answering Each Question
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    Instant Practice & Tutorial Mode. Step-by-step solution derivations and correct answers are revealed right after choosing an answer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={onCancel}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Next: Upload JSON &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: IMPORT JSON */}
      {activeStep === 2 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-3xl mx-auto space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">Upload JSON Questions</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setRawJsonText(CELE_JSON_TEMPLATE_FULL_EXAM);
                  processJson(CELE_JSON_TEMPLATE_FULL_EXAM);
                }}
                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-lg"
              >
                Sample 1
              </button>
              <button
                onClick={() => {
                  setRawJsonText(CELE_JSON_TEMPLATE_SINGLE);
                  processJson(CELE_JSON_TEMPLATE_SINGLE);
                }}
                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-lg"
              >
                Sample 2
              </button>
            </div>
          </div>

          {/* Drag & Drop File */}
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-orange-500 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl p-7 text-center transition relative cursor-pointer">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
              Click to select or drop .json file
            </h4>
          </div>

          {/* Raw Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Or Paste JSON
              </label>
              <button
                onClick={() => processJson(rawJsonText)}
                className="text-xs font-bold text-orange-500 hover:underline"
              >
                Validate
              </button>
            </div>
            <textarea
              rows={5}
              value={rawJsonText}
              onChange={e => setRawJsonText(e.target.value)}
              placeholder='[{"order": 1, "questionText": "...", "choices": [...], "correctAnswer": "A"}, ...]'
              className="w-full font-mono text-xs p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Validation Feedback */}
          {validationResult && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              validationResult.isValid
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  {validationResult.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span>
                    {validationResult.isValid ? 'Schema Valid' : 'Validation Errors'}
                  </span>
                </div>
                <span className="font-mono text-[11px]">
                  {validationResult.stats.totalQuestions} Questions
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setActiveStep(1)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-semibold"
            >
              &larr; Back
            </button>

            {questions.length > 0 && (
              <button
                onClick={() => setActiveStep(3)}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              >
                <span>Preview Items ({questions.length})</span>
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW QUESTIONS & FIGURES */}
      {activeStep === 3 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Action Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={questionSearch}
                onChange={e => setQuestionSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl text-xs font-bold">
                <span className="text-[10px] text-zinc-400 pl-1.5 uppercase font-black">Mode:</span>
                <button
                  type="button"
                  onClick={() => setExamMeta(prev => ({ ...prev, solutionVisibility: 'after_submission' }))}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    examMeta.solutionVisibility === 'after_submission'
                      ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-500/30'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Solutions only shown after submitting whole exam"
                >
                  <Shield className="w-3 h-3" />
                  <span>After Exam</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExamMeta(prev => ({ ...prev, solutionVisibility: 'per_question' }))}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    examMeta.solutionVisibility === 'per_question'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Solution appears after answering each question"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Per Question</span>
                </button>
              </div>

              <button
                onClick={handleAddQuestion}
                className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-orange-500" />
                <span>Add Question</span>
              </button>

              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="px-5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {effectiveMode === 'edit' ? (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Save & Update Exam</span>
                  </>
                ) : effectiveMode === 'clone' ? (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Deploy Cloned Exam</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Deploy ({examMeta.solutionVisibility === 'per_question' ? 'Per-Q' : 'Sealed'})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const actualIdx = questions.findIndex(item => item === q);
              return (
                <QuestionItemEditor
                  key={actualIdx}
                  question={q}
                  qIndex={actualIdx}
                  onAttachImage={handleAttachImage}
                  onAttachSampleSvg={handleAttachSampleSvg}
                  onRemoveImage={handleRemoveImage}
                  onQuestionChange={handleQuestionChange}
                  onChoiceChange={handleChoiceChange}
                  onDelete={() => handleDeleteQuestion(actualIdx)}
                  onOpenLightbox={onOpenLightbox}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Question Editor Card
interface QuestionItemEditorProps {
  question: Question;
  qIndex: number;
  onAttachImage: (qIndex: number, field: 'questionFigureUrl' | 'solutionFigureUrl', file: File) => void;
  onAttachSampleSvg: (qIndex: number, type: 'beam' | 'soil') => void;
  onRemoveImage: (qIndex: number, field: 'questionFigureUrl' | 'solutionFigureUrl') => void;
  onQuestionChange: (qIndex: number, field: keyof Question, value: any) => void;
  onChoiceChange: (qIndex: number, cIndex: number, text: string) => void;
  onDelete: () => void;
  onOpenLightbox: (url: string, title?: string) => void;
}

const QuestionItemEditor: React.FC<QuestionItemEditorProps> = ({
  question,
  qIndex,
  onAttachImage,
  onAttachSampleSvg,
  onRemoveImage,
  onQuestionChange,
  onChoiceChange,
  onDelete,
  onOpenLightbox,
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const qFileInputRef = useRef<HTMLInputElement>(null);
  const solFileInputRef = useRef<HTMLInputElement>(null);

  const handleClipboardPaste = (e: React.ClipboardEvent, field: 'questionFigureUrl' | 'solutionFigureUrl') => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          onAttachImage(qIndex, field, file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
            #{qIndex + 1}
          </span>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Problem #{qIndex + 1}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsEditingText(!isEditingText)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              isEditingText
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {isEditingText ? 'Done' : 'Edit Text'}
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="space-y-1">
        {isEditingText ? (
          <textarea
            rows={3}
            value={question.questionText}
            onChange={e => onQuestionChange(qIndex, 'questionText', e.target.value)}
            className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono outline-none"
          />
        ) : (
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <LatexRenderer text={question.questionText} />
          </div>
        )}
      </div>

      {/* Figure Slot */}
      <div
        className="p-3 rounded-2xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-2"
        onPaste={e => handleClipboardPaste(e, 'questionFigureUrl')}
        tabIndex={0}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
            <span>Problem Figure</span>
          </span>
          <span className="text-[10px] text-zinc-400">Ctrl+V or Import</span>
        </div>

        {question.questionFigureUrl ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <img
              src={question.questionFigureUrl}
              alt="Diagram"
              onClick={() => onOpenLightbox(question.questionFigureUrl!, `Question #${qIndex + 1} Diagram`)}
              className="h-20 w-28 object-contain bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer"
            />
            <div className="text-xs space-y-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Figure Attached</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => qFileInputRef.current?.click()}
                  className="text-orange-500 hover:underline font-bold text-[11px]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveImage(qIndex, 'questionFigureUrl')}
                  className="text-red-500 hover:underline font-bold text-[11px]"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="text-zinc-400 italic text-[11px]">No figure</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => qFileInputRef.current?.click()}
                className="px-2.5 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs rounded-lg"
              >
                Import Image
              </button>
              <button
                type="button"
                onClick={() => onAttachSampleSvg(qIndex, 'beam')}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs rounded-lg"
              >
                Sample Beam
              </button>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={qFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onAttachImage(qIndex, 'questionFigureUrl', f);
          }}
        />
      </div>

      {/* Choices Grid */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">
          Choices & Answer Key
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {question.choices.map((choice, cIdx) => {
            const isCorrect = choice.label === question.correctAnswer;
            return (
              <div
                key={choice.label}
                className={`p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                  isCorrect
                    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name={`correct_choice_${qIndex}`}
                  checked={isCorrect}
                  onChange={() => onQuestionChange(qIndex, 'correctAnswer', choice.label)}
                  className="mt-1 accent-orange-500 h-3.5 w-3.5 cursor-pointer"
                />

                <div className="flex-1 space-y-0.5">
                  <span className={`text-xs font-black ${isCorrect ? 'text-yellow-700 dark:text-yellow-400' : 'text-zinc-500'}`}>
                    Option {choice.label}
                  </span>

                  {isEditingText ? (
                    <input
                      type="text"
                      value={choice.text}
                      onChange={e => onChoiceChange(qIndex, cIdx, e.target.value)}
                      className="w-full p-1 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-xs outline-none"
                    />
                  ) : (
                    <div className="text-xs text-zinc-800 dark:text-zinc-200">
                      <LatexRenderer text={choice.text} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Derivation / Solution */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-700 dark:text-zinc-300">Solution / Derivation</span>
          <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
            Key: {question.correctAnswer}
          </span>
        </div>

        {isEditingText ? (
          <textarea
            rows={3}
            value={question.solutionText || ''}
            onChange={e => onQuestionChange(qIndex, 'solutionText', e.target.value)}
            className="w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono outline-none"
          />
        ) : (
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <LatexRenderer text={question.solutionText || 'No derivation.'} />
          </div>
        )}
      </div>
    </div>
  );
};
