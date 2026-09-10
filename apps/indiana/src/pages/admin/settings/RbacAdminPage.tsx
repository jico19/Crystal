import React, { useState, useEffect, useCallback } from 'react';
import { UserRoleAssignmentTable, UserRowItem } from '../../../components/admin/UserRoleAssignmentTable.js';
import { AuditLogViewer } from '../../../components/admin/AuditLogViewer.js';
import type { SecurityAuditLog, UserRole } from '@crystal/types';
import { Shield, Activity, Users, RefreshCw } from 'lucide-react';
import { DashboardPageHeader, DashboardTabs } from '@crystal/ui';
import api from '../../../lib/api.js';

export const RbacAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'audit'>('roles');

  const [users, setUsers] = useState<UserRowItem[]>([]);
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadRbacData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const [accountsRes, logsRes] = await Promise.allSettled([
        api.get('/api/v1/auth/test-accounts'),
        api.get('/api/v1/audit/logs'),
      ]);

      if (accountsRes.status === 'fulfilled' && accountsRes.value.data?.data?.accounts) {
        const rawAccounts = accountsRes.value.data.data.accounts;
        setUsers(
          rawAccounts.map((acc: any, idx: number) => ({
            id: acc.id || `usr-${idx + 1}`,
            org_id: acc.org_id || 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            full_name: acc.name || acc.email.split('@')[0],
            email: acc.email,
            role: acc.role || 'caregiver',
            state_code: acc.stateCode || 'IN',
            is_active: true,
            mfa_enabled: acc.role === 'agency_admin' || acc.role === 'super_admin',
            failed_login_attempts: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );
      }

      if (logsRes.status === 'fulfilled' && logsRes.value.data) {
        const logData = logsRes.value.data.logs || logsRes.value.data.data || logsRes.value.data;
        if (Array.isArray(logData)) {
          setLogs(logData);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load RBAC audit data via Axios:', err);
      setFetchError('Could not sync security logs. Ensure backend session is active.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRbacData();
  }, [loadRbacData]);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u))
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const storedUser = localStorage.getItem('crystal_user');
  const currentUserRole: UserRole = storedUser ? (JSON.parse(storedUser).role || 'agency_admin') : 'agency_admin';

  const rbacTabs = [
    { id: 'roles', label: 'User Role Assignments', icon: Users, count: users.length },
    { id: 'audit', label: 'HIPAA Audit Trail', icon: Activity, count: logs.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-white">
      {/* Unified Page Header */}
      <DashboardPageHeader
        title="Role-Based Access Control & HIPAA Audit Trail"
        subtitle="Manage system security roles, enforce least-privilege policies, and monitor immutable HIPAA access trails."
        icon={Shield}
        roleBadge={{ text: 'Security Admin', variant: 'amber' }}
        stateBadge={{ code: 'IN' }}
        statusPill={{ text: 'Immutable Audit Trail', dotColor: 'emerald' }}
        actions={
          <button
            type="button"
            onClick={loadRbacData}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Sync Security DB</span>
          </button>
        }
      />

      {fetchError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={loadRbacData} className="underline font-bold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Unified Tab Navigation */}
      <div className="flex items-center justify-start border-b border-slate-800 pb-4">
        <DashboardTabs
          tabs={rbacTabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      {/* Content */}
      {activeTab === 'roles' ? (
        <UserRoleAssignmentTable
          users={users}
          currentUserRole={currentUserRole}
          onUpdateRole={handleUpdateRole}
          onToggleActive={handleToggleActive}
        />
      ) : (
        <AuditLogViewer
          logs={logs}
          total={logs.length}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={setCurrentPage}
          onFilterChange={() => {}}
          onRefresh={loadRbacData}
        />
      )}
    </div>
  );
};
