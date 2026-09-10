import React from 'react';
import type { AggregatedKpis } from '@crystal/types';
import { Users, UserCheck, ShieldAlert, FileSpreadsheet, FileCheck, FileSignature } from 'lucide-react';
import { DashboardStatCard } from '@crystal/ui';

export interface KPICardGridProps {
  kpis: AggregatedKpis;
}

export const KPICardGrid: React.FC<KPICardGridProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <DashboardStatCard
        title="Caregivers"
        value={kpis.total_caregivers}
        subtext={`${kpis.active_caregivers} Active / Compliant`}
        icon={Users}
        variant="teal"
      />

      <DashboardStatCard
        title="Clients"
        value={kpis.total_clients}
        subtext={`${kpis.active_clients} Active Receivers`}
        icon={UserCheck}
        variant="blue"
      />

      <DashboardStatCard
        title="Active Auths"
        value={kpis.total_active_authorizations}
        subtext="Prior Authorizations"
        icon={FileSpreadsheet}
        variant="emerald"
      />

      <DashboardStatCard
        title="At-Risk Auths"
        value={kpis.at_risk_authorizations}
        subtext="Expiring / Low Units"
        icon={ShieldAlert}
        variant="amber"
      />

      <DashboardStatCard
        title="Pending Docs"
        value={kpis.pending_document_reviews}
        subtext="Review Needed"
        icon={FileCheck}
        variant="purple"
      />

      <DashboardStatCard
        title="Signatures"
        value={kpis.pending_signatures_count}
        subtext="Envelopes Awaiting"
        icon={FileSignature}
        variant="red"
      />
    </div>
  );
};
