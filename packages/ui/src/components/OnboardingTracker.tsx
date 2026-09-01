'use client';

import * as React from 'react';
import { CheckCircle, Clock, Loader, Circle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

/** Recognised milestone status values */
type MilestoneStatus = 'verified' | 'submitted' | 'in_progress' | 'not_started' | 'rejected';

export interface OnboardingTrackerProps {
  /** Map of milestone key to status string */
  checklist: Record<string, string>;
  /** Overall application status label */
  applicationStatus: string;
  /** 0-100 completion percentage */
  completionPercentage: number;
  /** ISO date string when the application was submitted */
  submittedAt?: string;
}

/** Ordered milestone keys and their human-readable display names */
const MILESTONES: { key: string; label: string }[] = [
  { key: 'application_form', label: 'Application Form' },
  { key: 'id_documents', label: 'ID Documents' },
  { key: 'background_check', label: 'Background Check' },
  { key: 'tb_physical', label: 'TB Test & Physical' },
  { key: 'in_service_orientation', label: 'In-Service Orientation' },
  { key: 'direct_deposit_w4', label: 'Direct Deposit & W-4' },
  { key: 'final_admin_approval', label: 'Final Admin Approval' },
];

interface StatusConfig {
  icon: React.ElementType;
  badgeClass: string;
  label: string;
}

const STATUS_CONFIG: Record<MilestoneStatus, StatusConfig> = {
  verified: {
    icon: CheckCircle,
    badgeClass: 'bg-green-100 text-green-700',
    label: 'Verified',
  },
  submitted: {
    icon: Clock,
    badgeClass: 'bg-blue-100 text-blue-700',
    label: 'Submitted',
  },
  in_progress: {
    icon: Loader,
    badgeClass: 'bg-yellow-100 text-yellow-700',
    label: 'In Progress',
  },
  not_started: {
    icon: Circle,
    badgeClass: 'bg-gray-100 text-gray-500',
    label: 'Not Started',
  },
  rejected: {
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-700',
    label: 'Rejected',
  },
};

/** Resolves a raw status string to a known MilestoneStatus, defaulting to 'not_started'. */
function resolveStatus(raw: string | undefined): MilestoneStatus {
  const known: MilestoneStatus[] = [
    'verified',
    'submitted',
    'in_progress',
    'not_started',
    'rejected',
  ];
  return known.includes(raw as MilestoneStatus) ? (raw as MilestoneStatus) : 'not_started';
}

/**
 * Post-submission milestone dashboard.
 * Displays a status banner, progress bar, and a vertical list of
 * 7 onboarding milestones each with a colour-coded status badge.
 */
export function OnboardingTracker({
  checklist,
  applicationStatus,
  completionPercentage,
  submittedAt,
}: OnboardingTrackerProps) {
  const clampedPct = Math.min(100, Math.max(0, completionPercentage));

  const formattedDate = React.useMemo(() => {
    if (!submittedAt) return null;
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(submittedAt));
    } catch {
      return submittedAt;
    }
  }, [submittedAt]);

  return (
    <div className="w-full space-y-6">
      {/* Status banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800">
          Application Submitted — {applicationStatus}
        </p>
        {formattedDate && (
          <p className="mt-0.5 text-xs text-blue-600">Submitted on {formattedDate}</p>
        )}
      </div>

      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="font-bold text-primary">{clampedPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${clampedPct}%` }}
            role="progressbar"
            aria-valuenow={clampedPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Milestone list */}
      <ul className="space-y-3 list-none p-0 m-0">
        {MILESTONES.map(({ key, label }, index) => {
          const status = resolveStatus(checklist[key]);
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <li
              key={key}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-800">{label}</span>
              </div>

              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  config.badgeClass
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {config.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
