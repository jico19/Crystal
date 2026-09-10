import React, { useEffect } from 'react';
import { History, Play, Trash2 } from 'lucide-react';
import type { WizardDraftData } from '../../hooks/useWizardDraft.ts';

interface ResumeDraftModalProps {
  isOpen: boolean;
  draft: WizardDraftData;
  onResume: () => void;
  onStartFresh: () => void;
}

export const ResumeDraftModal: React.FC<ResumeDraftModalProps> = ({
  isOpen,
  draft,
  onResume,
  onStartFresh,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onResume();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onResume]);

  if (!isOpen) return null;

  const targetStep = draft.currentStep || 1;
  const completedCount = draft.completedSteps?.length || 0;
  const lastSavedDate = draft.lastSavedAt
    ? new Date(draft.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Earlier today';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-draft-title"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-white text-center animate-scale-up"
      >
        <div className="inline-flex p-4 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
          <History className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h2 id="resume-draft-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Resume Saved Application?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            We found an unsubmitted application draft in your current browser session from {lastSavedDate}.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span>Last Active Step:</span>
            <span className="font-semibold text-white">Step {targetStep} of 5</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Completed Sections:</span>
            <span className="font-semibold text-teal-400">{completedCount} Completed</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onResume}
            style={{ backgroundColor: 'var(--primary, #0F766E)' }}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-lg text-white text-xs font-semibold shadow-lg hover:brightness-110 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume (Step {targetStep})</span>
          </button>

          <button
            type="button"
            onClick={onStartFresh}
            className="inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/60 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Start Fresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
