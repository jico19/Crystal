'use client';

import React from 'react';
import type { ComplianceScore } from '@crystal/types';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

export interface ComplianceScoreBannerProps {
  score: ComplianceScore;
  onUploadMissing?: () => void;
}

export function ComplianceScoreBanner({ score, onUploadMissing }: ComplianceScoreBannerProps) {
  const isFullyCompliant = score.score_percentage === 100;
  const hasExpiringSoon = score.expiring_soon_count > 0;
  const hasMissing = score.missing_count > 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Score & Status Ring */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
              isFullyCompliant
                ? 'bg-green-50 text-green-600 ring-2 ring-green-500/20'
                : score.score_percentage >= 50
                ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-500/20'
                : 'bg-red-50 text-red-600 ring-2 ring-red-500/20'
            }`}
          >
            {isFullyCompliant ? (
              <ShieldCheck className="h-8 w-8" />
            ) : (
              <span className="text-xl font-extrabold">{score.score_percentage}%</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                {isFullyCompliant
                  ? '100% Ready & Compliant'
                  : `${score.score_percentage}% Compliance Ready`}
              </h3>
              {hasExpiringSoon && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-3 w-3" />
                  {score.expiring_soon_count} Expiring Soon
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {isFullyCompliant
                ? 'All mandatory state credential documents are verified and active.'
                : `${score.approved_count} of ${score.total_required} mandatory credential categories approved.`}
            </p>
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:gap-3">
          <div className="rounded-xl bg-green-50/70 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
            </div>
            <div className="mt-1 text-lg font-extrabold text-green-800">{score.approved_count}</div>
          </div>

          <div className="rounded-xl bg-blue-50/70 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-blue-700">
              <Clock className="h-3.5 w-3.5" />
              Under Review
            </div>
            <div className="mt-1 text-lg font-extrabold text-blue-800">{score.under_review_count}</div>
          </div>

          <div className="rounded-xl bg-amber-50/70 px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Missing
            </div>
            <div className="mt-1 text-lg font-extrabold text-amber-800">{score.missing_count}</div>
          </div>

          {score.rejected_count > 0 && (
            <div className="rounded-xl bg-red-50/70 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-red-700">
                <XCircle className="h-3.5 w-3.5" />
                Action Needed
              </div>
              <div className="mt-1 text-lg font-extrabold text-red-800">{score.rejected_count}</div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFullyCompliant
                ? 'bg-green-500'
                : score.score_percentage >= 50
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${score.score_percentage}%` }}
          />
        </div>
      </div>

      {/* Missing Items Banner */}
      {hasMissing && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-700 shrink-0" />
            <span className="text-xs font-medium text-amber-900">
              Missing documents:{' '}
              <span className="font-semibold">
                {score.missing_categories
                  .slice(0, 3)
                  .map((c) => c.replace(/_/g, ' ').toUpperCase())
                  .join(', ')}
                {score.missing_categories.length > 3 && ` +${score.missing_categories.length - 3} more`}
              </span>
            </span>
          </div>
          {onUploadMissing && (
            <button
              type="button"
              onClick={onUploadMissing}
              className="shrink-0 text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline"
            >
              Upload Missing Documents &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
