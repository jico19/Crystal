'use client';

import React, { useState } from 'react';
import type {
  ClientAuthorization,
  AuthorizationUtilizationSummary,
  CreateAuthorizationInput,
  LogUtilizationInput,
} from '@crystal/types';
import { AuthorizationBurnDownCard } from './AuthorizationBurnDownCard';
import { CreateAuthorizationModal } from './CreateAuthorizationModal';

export interface ClientAuthorizationsListProps {
  clientId: string;
  clientName: string;
  orgId: string;
  authorizations: Array<ClientAuthorization & { summary?: AuthorizationUtilizationSummary }>;
  onCreateAuthorization: (input: CreateAuthorizationInput) => Promise<{ success: boolean; error?: string }>;
  onLogUtilization: (authId: string, input: LogUtilizationInput) => Promise<{ success: boolean; error?: string }>;
}

export const ClientAuthorizationsList: React.FC<ClientAuthorizationsListProps> = ({
  clientId,
  clientName,
  orgId,
  authorizations,
  onCreateAuthorization,
  onLogUtilization,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring_soon' | 'exhausted'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeLogAuthId, setActiveLogAuthId] = useState<string | null>(null);

  // Log Utilization Form State
  const [unitsToLog, setUnitsToLog] = useState<number>(16); // 4 hours default
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const filtered = authorizations.filter((auth) => {
    if (filter === 'all') return true;
    return auth.status === filter;
  });

  const totalRemainingHours = authorizations.reduce((acc, auth) => {
    const remainingUnits = Math.max(0, auth.total_units_authorized - auth.total_units_used);
    return acc + remainingUnits / 4;
  }, 0);

  const expiringSoonCount = authorizations.filter(
    (auth) => auth.status === 'expiring_soon' || (auth.summary && auth.summary.is_expiring_soon)
  ).length;

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogAuthId) return;

    try {
      setLogSubmitting(true);
      setLogError(null);
      const res = await onLogUtilization(activeLogAuthId, {
        units_to_log: Number(unitsToLog),
        service_date: serviceDate,
        notes: logNotes || undefined,
      });

      if (res.success) {
        setActiveLogAuthId(null);
        setLogNotes('');
      } else {
        setLogError(res.error || 'Failed to log units.');
      }
    } catch (err) {
      setLogError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLogSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block mb-1">
            Utilization & Prior Authorization Vault
          </span>
          <h2 className="text-2xl font-bold">{clientName}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time Medicaid &amp; Commercial unit burn-down tracking. 1 unit = 15 minutes.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center border border-white/10">
            <span className="text-xs text-slate-300 block">Remaining Care</span>
            <span className="text-xl font-bold text-teal-300">{totalRemainingHours.toFixed(1)} hrs</span>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center border border-white/10">
            <span className="text-xs text-slate-300 block">Expiring Soon</span>
            <span className={`text-xl font-bold ${expiringSoonCount > 0 ? 'text-amber-300' : 'text-slate-200'}`}>
              {expiringSoonCount}
            </span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Prior Auth
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['all', 'active', 'expiring_soon', 'exhausted'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors capitalize ${
              filter === tab
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((auth) => (
            <AuthorizationBurnDownCard
              key={auth.id}
              authorization={auth}
              onLogUtilization={(id) => setActiveLogAuthId(id)}
              onRenew={() => setIsCreateModalOpen(true)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No prior authorizations found in this category.</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Prior Auth" above to add Medicaid or insurance orders.</p>
        </div>
      )}

      {/* Log Units Modal */}
      {activeLogAuthId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Log Caregiver Shift Units</h3>
            <p className="text-xs text-slate-500 mb-4">
              Deducts authorized care units from this client prior authorization.
            </p>

            {logError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {logError}
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units Delivered (1 unit = 15m)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={unitsToLog}
                  onChange={(e) => setUnitsToLog(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-slate-900"
                />
                <span className="text-[11px] text-teal-700 mt-1 block">
                  &asymp; {(unitsToLog / 4).toFixed(2)} care hours
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Date</label>
                <input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Morning personal support shift completed by Caregiver."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveLogAuthId(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
                >
                  {logSubmitting ? 'Recording...' : 'Confirm & Deduct Units'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Renew Authorization Modal */}
      <CreateAuthorizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clientId={clientId}
        orgId={orgId}
        onSubmit={onCreateAuthorization}
      />
    </div>
  );
};
