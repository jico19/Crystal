'use client';

import React from 'react';
import type { TrainingModule, CaregiverTrainingProgress } from '@crystal/types';

export interface TrainingModuleCardProps {
  module: TrainingModule & { progress?: Partial<CaregiverTrainingProgress> };
  onStartCourse: (moduleId: string) => void;
  onTakeQuiz: (moduleId: string) => void;
  onViewCertificate?: (certificateHash: string) => void;
}

export const TrainingModuleCard: React.FC<TrainingModuleCardProps> = ({
  module,
  onStartCourse,
  onTakeQuiz,
  onViewCertificate,
}) => {
  const progress = module.progress;
  const watchPct = progress?.watch_progress_percentage || 0;
  const isVideoCompleted = progress?.video_completed || watchPct >= 90;
  const isPassed = progress?.passed || false;
  const hasCertificate = Boolean(progress?.certificate_hash);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hipaa':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'infection_control':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'elder_abuse':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'client_rights':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-xs px-2.5 py-0.5 font-medium rounded-full border ${getCategoryColor(
              module.category
            )}`}
          >
            {getCategoryLabel(module.category)}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{module.required_hours} hr credit</span>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 text-base leading-snug mb-1.5">
          {module.title}
        </h3>
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {module.description}
        </p>

        {/* Watch progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Video Progress</span>
            <span className="font-medium text-slate-700">{Math.round(watchPct)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isPassed
                  ? 'bg-emerald-500'
                  : isVideoCompleted
                  ? 'bg-indigo-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, watchPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        {isPassed ? (
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Passed ({progress?.quiz_score_percentage}%)</span>
          </div>
        ) : isVideoCompleted ? (
          <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded">
            Video Watched • Quiz Ready
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {watchPct > 0 ? 'In Progress' : 'Not Started'}
          </span>
        )}

        <div className="flex items-center gap-2">
          {isPassed && hasCertificate && onViewCertificate && (
            <button
              onClick={() => onViewCertificate(progress!.certificate_hash!)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Certificate
            </button>
          )}

          {!isPassed && isVideoCompleted ? (
            <button
              onClick={() => onTakeQuiz(module.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Take Quiz
            </button>
          ) : (
            <button
              onClick={() => onStartCourse(module.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              {watchPct > 0 ? 'Resume' : 'Start'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
