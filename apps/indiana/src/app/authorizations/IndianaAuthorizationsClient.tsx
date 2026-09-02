'use client';

import React, { useEffect, useState } from 'react';
import { ClientAuthorizationsList } from '@crystal/ui';
import type {
  ClientAuthorization,
  AuthorizationUtilizationSummary,
  CreateAuthorizationInput,
  LogUtilizationInput,
} from '@crystal/types';

interface IndianaAuthorizationsClientProps {
  orgId: string;
}

export function IndianaAuthorizationsClient({ orgId }: IndianaAuthorizationsClientProps) {
  const [authorizations, setAuthorizations] = useState<
    Array<ClientAuthorization & { summary?: AuthorizationUtilizationSummary }>
  >([]);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchAuthorizations = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/authorizations?org_id=${orgId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setAuthorizations(json.authorizations);
      }
    } catch (err) {
      console.warn('Failed to load authorizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorizations();
  }, [orgId, apiBaseUrl]);

  const handleCreate = async (input: CreateAuthorizationInput) => {
    const res = await fetch(`${apiBaseUrl}/api/v1/authorizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (json.success) {
      await fetchAuthorizations();
    }
    return json;
  };

  const handleLog = async (authId: string, input: LogUtilizationInput) => {
    const res = await fetch(`${apiBaseUrl}/api/v1/authorizations/${authId}/utilize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (json.success) {
      await fetchAuthorizations();
    }
    return json;
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading Indiana Prior Authorizations...</p>
      </div>
    );
  }

  return (
    <ClientAuthorizationsList
      clientId="cli-002"
      clientName="Cherish Open Arms • Active Client Authorizations"
      orgId={orgId}
      authorizations={authorizations}
      onCreateAuthorization={handleCreate}
      onLogUtilization={handleLog}
    />
  );
}
