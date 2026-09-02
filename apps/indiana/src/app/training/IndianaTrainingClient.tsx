'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingPortalCatalog, CertificateModal } from '@crystal/ui';
import type { TrainingModule, CaregiverTrainingProgress, TrainingComplianceSummary } from '@crystal/types';

interface IndianaTrainingClientProps {
  orgId: string;
  stateCode: 'GA' | 'IN' | 'FL';
}

export function IndianaTrainingClient({ stateCode }: IndianaTrainingClientProps) {
  const router = useRouter();
  const [modules, setModules] = useState<Array<TrainingModule & { progress?: Partial<CaregiverTrainingProgress> }>>([]);
  const [summary, setSummary] = useState<TrainingComplianceSummary | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [caregiverId, setCaregiverId] = useState('');
  const [activeCertHash, setActiveCertHash] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    let storedId = localStorage.getItem('crystal_caregiver_guest_id_in');
    if (!storedId) {
      storedId = `in-applicant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('crystal_caregiver_guest_id_in', storedId);
    }
    setCaregiverId(storedId);

    const fetchData = async () => {
      try {
        const [modRes, sumRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/training/modules?state_code=${stateCode}&caregiver_id=${encodeURIComponent(storedId)}`),
          fetch(`${apiBaseUrl}/api/v1/training/compliance-summary?caregiver_id=${encodeURIComponent(storedId)}&state_code=${stateCode}`),
        ]);

        if (modRes.ok) {
          const modJson = await modRes.json();
          if (modJson.success) setModules(modJson.modules);
        }
        if (sumRes.ok) {
          const sumJson = await sumRes.json();
          if (sumJson.success) setSummary(sumJson.summary);
        }
      } catch (err) {
        console.warn('Could not fetch training modules:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stateCode, apiBaseUrl]);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading Indiana In-Service Training Portal...</p>
      </div>
    );
  }

  return (
    <>
      <TrainingPortalCatalog
        modules={modules}
        complianceSummary={summary}
        stateCode={stateCode}
        onSelectModule={(id) => router.push(`/training/${id}`)}
        onTakeQuiz={(id) => router.push(`/training/${id}?quiz=true`)}
        onViewCertificate={(hash) => setActiveCertHash(hash)}
      />

      {activeCertHash && (
        <CertificateModal
          isOpen={Boolean(activeCertHash)}
          onClose={() => setActiveCertHash(null)}
          caregiverName="Caregiver Trainee"
          moduleTitle="Mandatory Indiana Home Care Training"
          hoursCredited={1.5}
          completedAt={new Date().toISOString()}
          certificateHash={activeCertHash}
          organizationName="Cherish Open Arms Home Care"
          stateCode="IN"
        />
      )}
    </>
  );
}
