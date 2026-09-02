'use client';

import React, { useState } from 'react';
import type {
  AdminDashboardMetrics,
  AdminWorkQueueItem,
  StateAuditReportRecord,
} from '@crystal/types';

export interface AdminCommandCenterProps {
  initialMetrics: AdminDashboardMetrics;
  initialQueues: AdminWorkQueueItem[];
  apiBaseUrl?: string;
}

export const AdminCommandCenter: React.FC<AdminCommandCenterProps> = ({
  initialMetrics,
  initialQueues,
  apiBaseUrl = 'http://localhost:3000',
}) => {
  const [selectedState, setSelectedState] = useState<'ALL' | 'GA' | 'IN'>('ALL');
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>(initialMetrics);
  const [queues, setQueues] = useState<AdminWorkQueueItem[]>(initialQueues);
  const [queueTab, setQueueTab] = useState<'all' | 'document_review' | 'application_review' | 'expiring_authorization'>('all');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch updated data when state filter changes
  const handleStateChange = async (state: 'ALL' | 'GA' | 'IN') => {
    setSelectedState(state);
    setLoading(true);
    try {
      const stateParam = state === 'ALL' ? '' : `?state_code=${state}`;
      const [kpiRes, queueRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/admin/kpis${stateParam}`),
        fetch(`${apiBaseUrl}/api/v1/admin/queues${stateParam}`),
      ]);

      if (kpiRes.ok) {
        const kpiJson = await kpiRes.json();
        if (kpiJson.success) setMetrics(kpiJson.data);
      }

      if (queueRes.ok) {
        const queueJson = await queueRes.json();
        if (queueJson.success) setQueues(queueJson.queues);
      }
    } catch (err) {
      console.warn('Failed to filter admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAudit = async () => {
    setDownloading(true);
    try {
      const stateParam = selectedState === 'ALL' ? '' : `?state_code=${selectedState}&format=csv`;
      const url = `${apiBaseUrl}/api/v1/admin/audit-export${stateParam}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const filteredQueues = queues.filter((q) => {
    if (queueTab === 'all') return true;
    return q.type === queueTab;
  });

  const totals = metrics.totals;

  return (
    <div className="space-y-8">
      {/* Top Header & State Switcher */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              Executive Multi-State Command Center
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Crystal Home Health Operations</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Consolidated operational intelligence across Georgia (With Open Hands) and Indiana (Cherish Open Arms).
          </p>
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          {(['ALL', 'GA', 'IN'] as const).map((code) => {
            const labels: Record<string, string> = {
              ALL: 'All States',
              GA: 'Georgia (WOH)',
              IN: 'Indiana (COA)',
            };
            return (
              <button
                key={code}
                onClick={() => handleStateChange(code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedState === code
                    ? 'bg-teal-500 text-slate-950 shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {labels[code]}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Active Caregivers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase">Active Caregivers</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totals.active_caregivers}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Approved
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">Active in-home staff</span>
        </div>

        {/* Card 2: Pending Applications */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase">Pending Apps</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold ${totals.pending_applications > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {totals.pending_applications}
            </span>
            {totals.pending_applications > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse">
                Needs Review
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-2">Submitted applicant funnel</span>
        </div>

        {/* Card 3: Pending Document Reviews */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase">Pending Docs</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold ${totals.pending_documents > 0 ? 'text-blue-600' : 'text-slate-900'}`}>
              {totals.pending_documents}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              OCR Processed
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">Credentials in verification</span>
        </div>

        {/* Card 4: Active Clients */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase">Active Clients</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totals.active_clients}</span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              Admitted
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">Receiving daily care</span>
        </div>

        {/* Card 5: Expiring Prior Auths */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase">Expiring Auths</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-3xl font-extrabold ${totals.expiring_authorizations > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {totals.expiring_authorizations}
            </span>
            {totals.expiring_authorizations > 0 && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                &le; 60 Days
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-2">Medicaid PA renewals</span>
        </div>

        {/* Card 6: Platform Utilization Burn-Down */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-semibold uppercase">Utilization Rate</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totals.overall_utilization_pct}%</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Burn-Down
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, totals.overall_utilization_pct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* State Survey Compliance & Audit Exporter Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 block mb-1">
            Regulatory Survey Readiness • GA DCH &amp; IN FSSA
          </span>
          <h3 className="text-xl font-bold">1-Click State Regulatory Audit Exporter</h3>
          <p className="text-xs text-slate-300 mt-1">
            Instantly compiles complete caregiver credential compliance, CPR validity, TB screens, and CEU hours into a state-surveyor formatted CSV.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          disabled={downloading}
          className="px-5 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloading ? 'Generating Packet...' : `Export ${selectedState === 'ALL' ? 'All States' : selectedState} Survey Audit CSV`}
        </button>
      </div>

      {/* Urgent Operational Queues */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Urgent Action Queues</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and advance pending onboarding files, credentials, and expiring prior authorizations.
            </p>
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: `All Items (${queues.length})` },
                { id: 'document_review', label: `Documents (${queues.filter((q) => q.type === 'document_review').length})` },
                { id: 'application_review', label: `Applications (${queues.filter((q) => q.type === 'application_review').length})` },
                { id: 'expiring_authorization', label: `Auths (${queues.filter((q) => q.type === 'expiring_authorization').length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setQueueTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  queueTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Queues List */}
        {filteredQueues.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredQueues.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      item.urgency === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : item.urgency === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.urgency}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>State: <strong>{item.state_code}</strong></span>
                      <span>•</span>
                      <span>Logged: {item.created_at.split('T')[0]}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={item.action_url}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap self-end sm:self-center"
                >
                  Review Now &rarr;
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold text-slate-800">All caught up!</p>
            <p className="text-xs text-slate-400 mt-0.5">No urgent review items in this queue.</p>
          </div>
        )}
      </div>
    </div>
  );
};
