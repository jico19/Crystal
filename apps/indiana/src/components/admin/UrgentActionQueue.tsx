import React from 'react';
import type { UrgentActionItem } from '@crystal/types';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export interface UrgentActionQueueProps {
  actions: UrgentActionItem[];
  onActionClick?: (item: UrgentActionItem) => void;
}

export const UrgentActionQueue: React.FC<UrgentActionQueueProps> = ({
  actions,
  onActionClick,
}) => {
  const getSeverityBadge = (sev: UrgentActionItem['severity']) => {
    switch (sev) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
            Urgent
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Action Required
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            Routine
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Urgent Action Queue
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
            {actions.length} items
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
        {actions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            No urgent action items pending! All authorizations and credentials are compliant.
          </div>
        ) : (
          actions.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{item.title}</span>
                  {getSeverityBadge(item.severity)}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                    {item.state_code}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{item.description}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>Due: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Immediate'}</span>
                </div>
              </div>

              {onActionClick && (
                <button
                  type="button"
                  onClick={() => onActionClick(item)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  <span>Resolve</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
