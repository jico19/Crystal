'use client';

import React from 'react';
import { ClientIntakeWizard } from '@crystal/ui';
import type { ClientIntakeInput } from '@crystal/types';

interface IndianaIntakeClientProps {
  orgId: string;
  stateCode: 'GA' | 'IN' | 'FL';
}

export function IndianaIntakeClient({ orgId, stateCode }: IndianaIntakeClientProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleSubmit = async (data: ClientIntakeInput) => {
    const res = await fetch(`${apiBaseUrl}/api/v1/clients/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  return (
    <ClientIntakeWizard
      orgId={orgId}
      stateCode={stateCode}
      organizationName="Cherish Open Arms"
      onSubmit={handleSubmit}
    />
  );
}
