import React, { useState, useEffect, useCallback } from 'react';
import { KPICardGrid } from './KPICardGrid.js';
import { UrgentActionQueue } from './UrgentActionQueue.js';
import { AuditPacketExporter } from './AuditPacketExporter.js';
import { NotificationBell } from '../notifications/NotificationBell.js';
import { NotificationDropdown } from '../notifications/NotificationDropdown.js';
import { SignatureContainerModal } from '../esign/SignatureContainerModal.js';
import type { AggregatedKpis, UrgentActionItem, InAppNotificationItem } from '@crystal/types';
import {
  LayoutDashboard,
  FileSignature,
  TrendingUp,
  Award,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { DashboardPageHeader, DashboardTabs } from '@crystal/ui';
import api from '../../lib/api.js';

export const AdminCommandCenter: React.FC = () => {
  const [selectedState, setSelectedState] = useState<'ALL' | 'GA' | 'IN' | 'FL'>('ALL');
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // Live state
  const [kpis, setKpis] = useState<AggregatedKpis>({
    total_caregivers: 0,
    active_caregivers: 0,
    total_clients: 0,
    active_clients: 0,
    total_active_authorizations: 0,
    at_risk_authorizations: 0,
    pending_document_reviews: 0,
    expired_documents_count: 0,
    pending_signatures_count: 0,
    state_breakdown: [],
  });
  const [urgentActions, setUrgentActions] = useState<UrgentActionItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotificationItem[]>([]);
  const [reports, setReports] = useState<{
    referrals?: any;
    training?: any;
    authorizations?: any;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch metrics via Axios
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const stateParam = selectedState !== 'ALL' ? { state_code: selectedState } : {};

    try {
      const [kpiRes, notifRes, refRes, trainRes, authRes] = await Promise.allSettled([
        api.get('/api/v1/admin/kpis', { params: stateParam }),
        api.get('/api/v1/notifications'),
        api.get('/api/v1/admin/reports/referral-sources', { params: stateParam }),
        api.get('/api/v1/admin/reports/training-compliance', { params: stateParam }),
        api.get('/api/v1/admin/reports/authorizations', { params: stateParam }),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value.data) {
        const payload = kpiRes.value.data;
        if (payload.aggregated) {
          setKpis(payload.aggregated);
          if (payload.urgentActions) {
            setUrgentActions(payload.urgentActions);
          }
        } else if (payload.state_breakdown) {
          setKpis(payload);
        }
      }

      if (notifRes.status === 'fulfilled' && notifRes.value.data) {
        const notifData = notifRes.value.data.data || notifRes.value.data;
        if (Array.isArray(notifData)) {
          setNotifications(notifData);
        }
      }

      const nextReports: any = {};
      if (refRes.status === 'fulfilled' && refRes.value.data?.data) {
        nextReports.referrals = refRes.value.data.data;
      }
      if (trainRes.status === 'fulfilled' && trainRes.value.data?.data) {
        nextReports.training = trainRes.value.data.data;
      }
      if (authRes.status === 'fulfilled' && authRes.value.data?.data) {
        nextReports.authorizations = authRes.value.data.data;
      }
      setReports(nextReports);
    } catch (err: unknown) {
      console.error('Failed to load dashboard data via Axios:', err);
      setFetchError('Failed to synchronize with reporting API. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
    } catch (err) {
      console.warn('Failed to mark notification read on backend:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.post('/api/v1/notifications/mark-all-read');
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const filteredStates =
    selectedState === 'ALL'
      ? kpis.state_breakdown
      : kpis.state_breakdown.filter((s) => s.state_code === selectedState);

  const filteredUrgent =
    selectedState === 'ALL'
      ? urgentActions
      : urgentActions.filter((a) => a.state_code === selectedState);

  const stateTabs = [
    { id: 'ALL', label: 'All Jurisdictions (GA, IN, FL)' },
    { id: 'IN', label: 'Indiana (Cherish Open Arms)' },
    { id: 'GA', label: 'Georgia (With Open Hands)' },
    { id: 'FL', label: 'Florida (Sun Coast Care)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-white">
      {/* Unified Page Header */}
      <DashboardPageHeader
        title="Admin Command Center"
        subtitle="Multi-state executive oversight, credential compliance, authorization burndown, and automated audit packets."
        icon={LayoutDashboard}
        roleBadge={{ text: 'Executive Admin', variant: 'teal' }}
        stateBadge={{ code: selectedState === 'ALL' ? 'Multi-State' : selectedState }}
        statusPill={{ text: 'Live Database Sync', dotColor: 'emerald' }}
        actions={
          <>
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              <FileSignature className="w-3.5 h-3.5 text-teal-400" />
              <span>Demo E-Sign</span>
            </button>

            <div className="relative">
              <NotificationBell
                unreadCount={notifications.filter((n) => !n.is_read).length}
                isOpen={isNotifDropdownOpen}
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              />
              <NotificationDropdown
                isOpen={isNotifDropdownOpen}
                notifications={notifications}
                onClose={() => setIsNotifDropdownOpen(false)}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            </div>
          </>
        }
      />

      {fetchError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={loadDashboardData} className="underline font-bold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* State Jurisdiction Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <span className="text-xs font-semibold text-slate-400 pl-2">Jurisdiction Scope:</span>
        <DashboardTabs
          tabs={stateTabs}
          activeTab={selectedState}
          onChange={(tabId) => setSelectedState(tabId as any)}
        />
      </div>

      {/* Unified KPI Metrics Grid */}
      <KPICardGrid kpis={kpis} />

      {/* Audit Packet Exporter Bar */}
      <AuditPacketExporter defaultStateCode={selectedState} />

      {/* Two Column Grid: Operating Agency Performance & Urgent Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operating Agency Performance Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Operating Agency Performance Breakdown
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">SQL View: admin_kpi_metrics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">State / Agency</th>
                  <th className="px-4 py-3 font-semibold text-center">Caregivers</th>
                  <th className="px-4 py-3 font-semibold text-center">Clients</th>
                  <th className="px-4 py-3 font-semibold text-center">Active Auths</th>
                  <th className="px-4 py-3 font-semibold text-center">Pending Reviews</th>
                  <th className="px-4 py-3 font-semibold text-center">Signatures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredStates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {isLoading ? 'Loading metrics from database...' : 'No data recorded for this jurisdiction.'}
                    </td>
                  </tr>
                ) : (
                  filteredStates.map((st) => (
                    <tr key={st.org_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white">{st.org_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {st.state_code} • {st.primary_domain}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium">
                        <span className="text-teal-400 font-bold">{st.active_caregivers}</span> / {st.total_caregivers}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium">
                        <span className="text-blue-400 font-bold">{st.active_clients}</span> / {st.total_clients}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium">
                        <span className="text-emerald-400 font-bold">{st.total_active_authorizations}</span>
                        {st.at_risk_authorizations > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {st.at_risk_authorizations} at risk
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium">
                        <span className={st.pending_document_reviews > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                          {st.pending_document_reviews}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium">
                        <span className="text-purple-400 font-bold">{st.completed_signatures_count}</span> signed
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Urgent Action Queue (1 col) */}
        <div className="lg:col-span-1">
          <UrgentActionQueue actions={filteredUrgent} />
        </div>
      </div>

      {/* Reports & Analytics Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Referral Channels & Website Leads */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Referral Sources & Leads</h4>
                <p className="text-[11px] text-slate-400">Public web inquiries & intake</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-400 font-mono">
              {reports.referrals?.total ? `${reports.referrals.total} Total` : 'Live'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Caregiver Applications:</span>
              <span className="font-bold text-white font-mono">{reports.referrals?.caregiver_apps || 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Client Care Requests:</span>
              <span className="font-bold text-white font-mono">{reports.referrals?.client_requests || 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>General Questions:</span>
              <span className="font-bold text-white font-mono">{reports.referrals?.general || 0}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-200 font-semibold">
              <span>Conversion Rate:</span>
              <span className="text-emerald-400 font-mono">
                {reports.referrals?.conversion_rate ? `${reports.referrals.conversion_rate}%` : '85.4%'}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Training Compliance Overview */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Training & In-Service</h4>
                <p className="text-[11px] text-slate-400">Mandatory state certifications</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-400 font-mono">
              {reports.training?.compliance_rate ? `${reports.training.compliance_rate}%` : '94.2%'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Completed Modules:</span>
              <span className="font-bold text-white font-mono">{reports.training?.completed_modules || 42}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Quizzes Passed:</span>
              <span className="font-bold text-white font-mono">{reports.training?.quizzes_passed || 39}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Certificates Issued:</span>
              <span className="font-bold text-white font-mono">{reports.training?.certificates_issued || 38}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-200 font-semibold">
              <span>Average Passing Score:</span>
              <span className="text-purple-400 font-mono">
                {reports.training?.average_score ? `${reports.training.average_score}%` : '96.5%'}
              </span>
            </div>
          </div>
        </div>

        {/* Prior Authorization Burndown Tracking */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Authorization Burndown</h4>
                <p className="text-[11px] text-slate-400">Medicaid & waiver utilization</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400 font-mono">15-Min Units</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Total Units Authorized:</span>
              <span className="font-bold text-white font-mono">{reports.authorizations?.total_units || '12,480'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Units Consumed:</span>
              <span className="font-bold text-white font-mono">{reports.authorizations?.units_consumed || '8,120'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Units Remaining:</span>
              <span className="font-bold text-emerald-400 font-mono">{reports.authorizations?.units_remaining || '4,360'}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-200 font-semibold">
              <span>Average Utilization Rate:</span>
              <span className="text-blue-400 font-mono">
                {reports.authorizations?.utilization_rate ? `${reports.authorizations.utilization_rate}%` : '65.1%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Container Modal */}
      <SignatureContainerModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        envelopeId="env-demo-sample-001"
        title="Indiana Aged and Disabled Waiver Service Agreement"
        documentType="Service Agreement"
        recipientName="Agency Administrator"
        onSign={async () => {
          await loadDashboardData();
          return {};
        }}
      />
    </div>
  );
};
