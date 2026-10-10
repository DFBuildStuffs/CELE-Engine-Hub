import React from 'react';
import { Trash2, AlertTriangle, X, Clock, Layers, Loader2 } from 'lucide-react';
import { Exam } from '../types';
import { CELE_SUBJECTS } from '../lib/constants';

interface DeleteExamModalProps {
  exam: Exam | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteExamModal: React.FC<DeleteExamModalProps> = ({
  exam,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !exam) return null;

  const subjectMeta = CELE_SUBJECTS[exam.subject] || CELE_SUBJECTS.SEC;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Delete Exam
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Permanent archive removal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning & Exam Preview */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Are you sure you want to permanently delete this exam? It will be removed from Firebase Cloud and cannot be recovered.
          </p>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${subjectMeta.badgeBg} ${subjectMeta.badgeBorder} ${subjectMeta.badgeText}`}>
                {subjectMeta.name}
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {exam.title}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
              <span className="flex items-center gap-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                {exam.questions?.length || 0} items
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {exam.timeLimit} mins
              </span>
              <span className="font-mono text-[10px] text-zinc-400 truncate">
                ID: {exam.id}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Exam</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
