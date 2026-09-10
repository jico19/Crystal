import React, { useState, useEffect, useCallback } from 'react';
import { ClientRosterTable, ClientRowItem } from '../../components/clients/ClientRosterTable.js';
import { ClientIntakeWizard } from '../../components/clients/ClientIntakeWizard.js';
import { ClientProfileModal } from '../../components/clients/ClientProfileModal.js';
import { ClientAuthorizationsList } from '../../components/authorizations/ClientAuthorizationsList.js';
import { CreateAuthorizationModal } from '../../components/authorizations/CreateAuthorizationModal.js';
import type {
  ClientProfile,
  ClientDocument,
  ClientStatus,
  ClientDocCategory,
  ClientAuthorization,
} from '@crystal/types';
import type { CreateClientIntakeInput, CreateAuthorizationInput } from '@crystal/validation';
import { Users, ShieldCheck, UserCheck, AlertTriangle, RefreshCw, UserPlus } from 'lucide-react';
import { DashboardPageHeader, DashboardTabs, DashboardStatCard } from '@crystal/ui';
import api from '../../lib/api.js';

export const ClientOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roster' | 'authorizations'>('roster');

  // Indiana Org ID
  const orgId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  // Live state from API
  const [clients, setClients] = useState<ClientRowItem[]>([]);
  const [authorizations, setAuthorizations] = useState<
    Array<ClientAuthorization & { client_first_name?: string; client_last_name?: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Active client detail for modal
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [clientDocs, setClientDocs] = useState<ClientDocument[]>([]);

  // Wizard state
  const [isIntakeWizardOpen, setIsIntakeWizardOpen] = useState(false);

  // Authorization modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetAuthClient, setTargetAuthClient] = useState<{ id: string; name: string } | null>(null);

  // Load clients & authorizations via Axios
  const loadOperationsData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const [clientsRes, authsRes] = await Promise.allSettled([
        api.get('/api/v1/clients'),
        api.get('/api/v1/authorizations'),
      ]);

      if (clientsRes.status === 'fulfilled' && clientsRes.value.data) {
        const raw = clientsRes.value.data.clients || clientsRes.value.data.data || clientsRes.value.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setClients(
            raw.map((c: any) => ({
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
              dob: c.dob,
              gender: c.gender,
              medicaid_id: c.medicaid_id || null,
              status: c.status,
              active_authorizations_count: Number(c.active_authorizations_count || 0),
              documents_count: Number(c.documents_count || 0),
              created_at: c.created_at,
            }))
          );
        }
      }

      if (authsRes.status === 'fulfilled' && authsRes.value.data) {
        const rawAuths = authsRes.value.data.authorizations || authsRes.value.data.data || authsRes.value.data;
        if (Array.isArray(rawAuths)) {
          setAuthorizations(rawAuths);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load clients or authorizations:', err);
      setFetchError('Unable to connect to client service. Check server status.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOperationsData();
  }, [loadOperationsData]);

  // Handlers using real Axios calls
  const handleViewClient = async (clientRow: ClientRowItem) => {
    try {
      const [profRes, docsRes] = await Promise.allSettled([
        api.get(`/api/v1/clients/${clientRow.id}`),
        api.get(`/api/v1/clients/${clientRow.id}/documents`),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.data) {
        setSelectedClient(profRes.value.data.client || profRes.value.data);
      } else {
        setSelectedClient({
          id: clientRow.id,
          org_id: orgId,
          first_name: clientRow.first_name,
          last_name: clientRow.last_name,
          dob: clientRow.dob,
          gender: clientRow.gender as any,
          medicaid_id: clientRow.medicaid_id,
          status: clientRow.status,
          service_address: {
            street: '123 Care Way',
            city: 'Indianapolis',
            state: 'IN',
            zip: '46201',
          },
          emergency_contacts: [
            {
              name: 'Emergency Contact',
              relationship: 'Family Member',
              phone: '317-555-0199',
              is_primary: true,
            },
          ],
          care_needs: {},
          payer_details: {
            payer_name: 'Indiana Aged & Disabled Waiver',
            plan_type: 'A&D Waiver',
          },
          created_at: clientRow.created_at,
          updated_at: clientRow.created_at,
        });
      }

      if (docsRes.status === 'fulfilled' && docsRes.value.data) {
        setClientDocs(docsRes.value.data.documents || docsRes.value.data.data || []);
      } else {
        setClientDocs([]);
      }

      setIsProfileModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch client details:', err);
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: ClientStatus) => {
    try {
      await api.patch(`/api/v1/clients/${clientId}/status`, { status: newStatus });
      setSelectedClient((prev) => (prev ? { ...prev, status: newStatus } : null));
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to update client status on backend:', err);
    }
  };

  const handleUploadDoc = async (
    clientId: string,
    category: ClientDocCategory,
    file: File
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', category);
      formData.append('category', category);

      const res = await api.post(`/api/v1/clients/${clientId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedDoc = res.data?.document || {
        id: `doc-new-${Date.now()}`,
        client_id: clientId,
        category,
        document_type: category,
        file_name: file.name,
        file_url: '#',
        file_size_bytes: file.size,
        mime_type: file.type || 'application/pdf',
        status: 'approved',
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setClientDocs((prev) => [uploadedDoc, ...prev]);
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, documents_count: (c.documents_count || 0) + 1 }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to upload client document:', err);
      throw err;
    }
  };

  const handleCreateIntake = async (data: CreateClientIntakeInput) => {
    try {
      const res = await api.post('/api/v1/clients', data);
      const created = res.data;
      const newRow: ClientRowItem = {
        id: created.id,
        first_name: created.first_name,
        last_name: created.last_name,
        dob: created.dob,
        gender: created.gender,
        medicaid_id: created.medicaid_id || null,
        status: created.status || 'intake_draft',
        active_authorizations_count: 0,
        documents_count: 0,
        created_at: created.created_at || new Date().toISOString(),
      };
      setClients((prev) => [newRow, ...prev]);
      setIsIntakeWizardOpen(false);
    } catch (err) {
      console.error('Failed to submit client intake:', err);
      throw err;
    }
  };

  const handleOpenAuthModal = (clientRow: ClientRowItem) => {
    setTargetAuthClient({
      id: clientRow.id,
      name: `${clientRow.first_name} ${clientRow.last_name}`,
    });
    setIsAuthModalOpen(true);
  };

  const handleCreateAuthorization = async (data: CreateAuthorizationInput) => {
    try {
      const res = await api.post(`/api/v1/clients/${data.client_id}/authorizations`, data);
      const created = res.data;
      const newAuth: ClientAuthorization & { client_first_name?: string; client_last_name?: string } = {
        ...created,
        client_first_name: targetAuthClient?.name?.split(' ')[0] || 'Client',
        client_last_name: targetAuthClient?.name?.split(' ')[1] || '',
      };

      setAuthorizations((prev) => [newAuth, ...prev]);
      setClients((prev) =>
        prev.map((c) =>
          c.id === data.client_id
            ? { ...c, active_authorizations_count: (c.active_authorizations_count || 0) + 1 }
            : c
        )
      );
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Failed to create authorization:', err);
      throw err;
    }
  };

  const handleDeductUnits = async (authId: string, units: number, notes?: string) => {
    try {
      await api.patch(`/api/v1/authorizations/${authId}/units`, {
        units_used_delta: units,
        notes,
      });

      setAuthorizations((prev) =>
        prev.map((auth) => {
          if (auth.id !== authId) return auth;
          const newUsed = auth.total_units_used + units;
          const newStatus = newUsed >= auth.total_units_authorized ? 'exhausted' : auth.status;
          return {
            ...auth,
            total_units_used: newUsed,
            status: newStatus,
          };
        })
      );
    } catch (err) {
      console.error('Failed to deduct authorization units on server:', err);
    }
  };

  // Summary counts
  const totalClientsCount = clients.length;
  const activeClientsCount = clients.filter((c) => c.status === 'active').length;
  const activeAuthsCount = authorizations.filter((a) => a.status === 'active').length;
  const atRiskAuthsCount = authorizations.filter(
    (a) => a.status === 'expiring_soon' || a.status === 'exhausted'
  ).length;

  const operationTabs = [
    { id: 'roster', label: 'Client Roster & Intakes', icon: Users, count: clients.length },
    { id: 'authorizations', label: 'Prior Authorizations', icon: ShieldCheck, count: authorizations.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-white">
      {/* Unified Page Header */}
      <DashboardPageHeader
        title="Client Intake & Prior Authorization Utilization"
        subtitle="Indiana Aged & Disabled Waiver authorizations, clinical intake pipeline, and real-time 15-minute unit burndown."
        icon={Users}
        roleBadge={{ text: 'Clinical Operations', variant: 'blue' }}
        stateBadge={{ code: 'IN' }}
        statusPill={{ text: 'Live DB Sync', dotColor: 'emerald' }}
        actions={
          <>
            <button
              type="button"
              onClick={loadOperationsData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
              <span>Sync DB</span>
            </button>

            <button
              type="button"
              onClick={() => setIsIntakeWizardOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Client Intake</span>
            </button>
          </>
        }
      />

      {fetchError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={loadOperationsData} className="underline font-bold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Unified Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Clients"
          value={isLoading ? '...' : totalClientsCount}
          subtitle="Enrolled & pending intakes"
          icon={Users}
          color="blue"
        />
        <DashboardStatCard
          title="Active Services"
          value={isLoading ? '...' : activeClientsCount}
          subtitle="Actively receiving care"
          icon={UserCheck}
          color="teal"
        />
        <DashboardStatCard
          title="Active Authorizations"
          value={isLoading ? '...' : activeAuthsCount}
          subtitle="Approved waiver auths"
          icon={ShieldCheck}
          color="purple"
        />
        <DashboardStatCard
          title="At-Risk / Expiring"
          value={isLoading ? '...' : atRiskAuthsCount}
          subtitle="Requires clinical renewal"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Unified Tab Navigation */}
      <div className="flex items-center justify-start border-b border-slate-800 pb-4">
        <DashboardTabs
          tabs={operationTabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      {/* Tab Contents */}
      {activeTab === 'roster' ? (
        <ClientRosterTable
          clients={clients}
          isLoading={isLoading}
          onViewClient={handleViewClient}
          onNewIntake={() => setIsIntakeWizardOpen(true)}
          onAddAuthorization={handleOpenAuthModal}
        />
      ) : (
        <ClientAuthorizationsList
          authorizations={authorizations}
          isLoading={isLoading}
          onDeductUnits={handleDeductUnits}
          onNewAuthorization={() => {
            if (clients.length > 0) {
              handleOpenAuthModal(clients[0]);
            } else {
              setIsIntakeWizardOpen(true);
            }
          }}
        />
      )}

      {/* Modals */}
      <ClientProfileModal
        client={selectedClient}
        documents={clientDocs}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onStatusChange={handleStatusChange}
        onUploadDoc={handleUploadDoc}
      />

      <ClientIntakeWizard
        orgId={orgId}
        isOpen={isIntakeWizardOpen}
        onClose={() => setIsIntakeWizardOpen(false)}
        onSubmit={handleCreateIntake}
      />

      {targetAuthClient && (
        <CreateAuthorizationModal
          clientId={targetAuthClient.id}
          clientName={targetAuthClient.name}
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSubmit={handleCreateAuthorization}
        />
      )}
    </div>
  );
};
