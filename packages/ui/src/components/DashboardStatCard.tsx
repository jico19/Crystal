import React from 'react';

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'teal' | 'emerald' | 'blue' | 'amber' | 'purple' | 'red';
  color?: 'teal' | 'emerald' | 'blue' | 'amber' | 'purple' | 'red';
  badge?: {
    text: string;
    variant?: 'emerald' | 'amber' | 'red' | 'blue' | 'teal';
  };
  onClick?: () => void;
  className?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  subtext,
  subtitle,
  icon: Icon,
  variant,
  color,
  badge,
  onClick,
  className = '',
}) => {
  const effectiveVariant = variant || color || 'teal';
  const effectiveSubtext = subtext || subtitle;
  const glowBorders = {
    teal: 'border-t-teal-500/80',
    emerald: 'border-t-emerald-500/80',
    blue: 'border-t-blue-500/80',
    amber: 'border-t-amber-500/80',
    purple: 'border-t-purple-500/80',
    red: 'border-t-red-500/80',
  };

  const iconColors = {
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  const badgeStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-slate-900/80 border border-slate-800 border-t-2 ${
        glowBorders[effectiveVariant]
      } shadow-lg space-y-3 transition-all ${
        onClick ? 'cursor-pointer hover:bg-slate-800/80 hover:border-slate-700' : ''
      } ${className}`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl border shrink-0 ${iconColors[effectiveVariant]}`}>
            <Icon className="w-4 h-4 stroke-[2]" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
          {value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              badgeStyles[badge.variant || 'teal']
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {effectiveSubtext && (
        <p className="text-[11px] text-slate-400 leading-snug">
          {effectiveSubtext}
        </p>
      )}
    </div>
  );
};
