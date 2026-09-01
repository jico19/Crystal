'use client';

import { useEffect, useState } from 'react';
import { CaregiverApplyWizard } from '@crystal/ui';
import { useRouter } from 'next/navigation';

interface IndianaApplyClientProps {
  orgId: string;
  stateCode: 'GA' | 'IN' | 'FL';
}

export function IndianaApplyClient({ orgId, stateCode }: IndianaApplyClientProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Persistent guest ID in localStorage for local testing
    let storedId = localStorage.getItem('crystal_caregiver_guest_id_in');
    if (!storedId) {
      storedId = `in-applicant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('crystal_caregiver_guest_id_in', storedId);
    }
    setUserId(storedId);
  }, []);

  if (!userId) {
    return null; // Brief hydration mounting guard
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  return (
    <CaregiverApplyWizard
      orgId={orgId}
      stateCode={stateCode}
      userId={userId}
      apiBaseUrl={apiBaseUrl}
      onSubmitSuccess={(applicationId) => {
        router.push(`/apply/status?app=${encodeURIComponent(applicationId)}&user_id=${encodeURIComponent(userId)}`);
      }}
    />
  );
}
