'use client';

import React, { useEffect, useState } from 'react';
import { AdminCommandCenter } from '@crystal/ui';
import type { AdminDashboardMetrics, AdminWorkQueueItem } from '@crystal/types';

export function GeorgiaAdminClient() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [queues, setQueues] = useState<AdminWorkQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [kpiRes, queueRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/admin/kpis?state_code=GA`),
          fetch(`${apiBaseUrl}/api/v1/admin/queues?state_code=GA`),
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
        console.warn('Failed to load Georgia admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [apiBaseUrl]);

  if (loading || !metrics) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading Georgia State Command Center...</p>
      </div>
    );
  }

  return (
    <AdminCommandCenter
      initialMetrics={metrics}
      initialQueues={queues}
      apiBaseUrl={apiBaseUrl}
    />
  );
}
