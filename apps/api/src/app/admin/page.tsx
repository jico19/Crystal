import { Metadata } from 'next';
import { getAdminDashboardMetricsDb, getAdminWorkQueuesDb } from '@/lib/db';
import { AdminCommandCenter } from '@crystal/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Executive Command Center | Crystal Home Health Platform',
  description:
    'Consolidated executive intelligence, caregiver compliance, active client rosters, and state regulatory audit exports across Georgia and Indiana.',
};

export default async function CentralAdminPage() {
  const [metrics, queues] = await Promise.all([
    getAdminDashboardMetricsDb('ALL'),
    getAdminWorkQueuesDb('ALL'),
  ]);

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <AdminCommandCenter
          initialMetrics={metrics}
          initialQueues={queues}
          apiBaseUrl=""
        />
      </div>
    </div>
  );
}
