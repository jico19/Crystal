'use client';

import React from 'react';
import type { ClientAuthorization, AuthorizationUtilizationSummary } from '@crystal/types';

export interface AuthorizationBurnDownCardProps {
  authorization: ClientAuthorization & { summary?: AuthorizationUtilizationSummary };
  onLogUtilization?: (authId: string) => void;
  onRenew?: (authId: string) => void;
}

export const AuthorizationBurnDownCard: React.FC<AuthorizationBurnDownCardProps> = ({
  authorization,
  onLogUtilization,
  onRenew,
}) => {
  const summary = authorization.summary || {
    authorization_id: authorization.id,
    total_units_authorized: authorization.total_units_authorized,
    total_units_used: authorization.total_units_used,
    remaining_units: Math.max(0, authorization.total_units_authorized - authorization.total_units_used),
    total_hours_authorized: authorization.total_units_authorized / 4,
    total_hours_used: authorization.total_units_used / 4,
    remaining_hours: Math.max(0, authorization.total_units_authorized - authorization.total_units_used) / 4,
    percent_utilized: Math.min(100, Math.round((authorization.total_units_used / authorization.total_units_authorized) * 100)),
    days_remaining: 60,
    is_expiring_soon: authorization.status === 'expiring_soon',
    is_urgent: false,
    is_exhausted: authorization.status === 'exhausted',
    is_overutilized: authorization.total_units_used > authorization.total_units_authorized,
    weekly_hours_cap: authorization.weekly_hours_cap,
    status: authorization.status,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Expiring Soon
          </span>
        );
      case 'exhausted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Units Exhausted
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {status.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
      <div className="p-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 font-mono text-xs font-bold rounded bg-slate-900 text-white">
              {authorization.procedure_code}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
              {authorization.payer_name}
            </span>
          </div>
          {getStatusBadge(summary.status)}
        </div>

        {/* Title & Service Type */}
        <h4 className="font-bold text-slate-900 text-base mb-1">
          {authorization.service_type}
        </h4>
        <div className="text-xs text-slate-500 mb-4 font-mono">
          Auth #: <span className="font-semibold text-slate-800">{authorization.authorization_number}</span>
        </div>

        {/* Utilization Burn-Down Meter */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">
              Burn-Down: <strong>{summary.total_hours_used} hrs</strong> of {summary.total_hours_authorized} hrs
            </span>
            <span className={`font-bold ${summary.percent_utilized >= 90 ? 'text-rose-600' : 'text-slate-900'}`}>
              {summary.percent_utilized}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                summary.is_exhausted
                  ? 'bg-rose-600'
                  : summary.percent_utilized >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, summary.percent_utilized)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>{summary.remaining_units} units ({summary.remaining_hours} hrs) left</span>
            <span>{summary.total_units_authorized} total units</span>
          </div>
        </div>

        {/* Authorization Details Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 text-xs border border-slate-100">
          <div>
            <span className="text-slate-500 block">Valid Period</span>
            <span className="font-medium text-slate-800">
              {authorization.start_date} &rarr; {authorization.end_date}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Days Remaining</span>
            <span className={`font-bold ${summary.days_remaining <= 30 ? 'text-rose-600' : 'text-slate-800'}`}>
              {summary.days_remaining > 0 ? `${summary.days_remaining} days` : 'Lapsed'}
            </span>
          </div>

          {authorization.weekly_hours_cap && (
            <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Weekly Hours Cap:</span>
              <span className="font-semibold text-slate-900">{authorization.weekly_hours_cap} hrs / week</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500 font-medium">1 unit = 15 mins</span>

        <div className="flex items-center gap-2">
          {summary.is_expiring_soon && onRenew && (
            <button
              onClick={() => onRenew(authorization.id)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
            >
              Request Renewal
            </button>
          )}

          {onLogUtilization && (
            <button
              onClick={() => onLogUtilization(authorization.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Log Care Units
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
