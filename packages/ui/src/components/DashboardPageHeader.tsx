import React from 'react';

export interface DashboardPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  roleBadge?: {
    text: string;
    variant?: 'teal' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  };
  stateBadge?: {
    code: string;
    label?: string;
  };
  statusPill?: {
    text: string;
    dotColor?: 'emerald' | 'blue' | 'amber' | 'rose';
  };
  actions?: React.ReactNode;
}

export const DashboardPageHeader: React.FC<DashboardPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  roleBadge,
  stateBadge,
  statusPill,
  actions,
}) => {
  const badgeColors = {
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
      <div className="space-y-2">
        {/* Badges Stack */}
        <div className="flex flex-wrap items-center gap-2">
          {roleBadge && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                badgeColors[roleBadge.variant || 'teal']
              }`}
            >
              {roleBadge.text}
            </span>
          )}

          {stateBadge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono font-semibold">
              📍 {stateBadge.code} {stateBadge.label ? `• ${stateBadge.label}` : ''}
            </span>
          )}

          {statusPill && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColors[statusPill.dotColor || 'emerald']} animate-pulse`} />
              <span>{statusPill.text}</span>
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 shadow-sm shrink-0">
              <Icon className="w-6 h-6 stroke-[2]" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
