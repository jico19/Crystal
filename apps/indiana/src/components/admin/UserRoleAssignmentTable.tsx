import React, { useState } from 'react';
import type { UserProfile, UserRole } from '@crystal/types';
import { Button } from '@crystal/ui';
import { Badge } from '@crystal/ui';
import { Modal } from '@crystal/ui';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck, UserX } from 'lucide-react';

export interface UserRowItem extends UserProfile {
  full_name: string;
  email: string;
}

export interface UserRoleAssignmentTableProps {
  users: UserRowItem[];
  currentUserRole: UserRole;
  errorMessage?: string | null;
  onRetry?: () => void;
  onUpdateRole: (userId: string, newRole: UserRole) => Promise<void>;
  onToggleActive: (userId: string, isActive: boolean) => Promise<void>;
}

export const UserRoleAssignmentTable: React.FC<UserRoleAssignmentTableProps> = ({
  users,
  currentUserRole,
  errorMessage,
  onRetry,
  onUpdateRole,
  onToggleActive,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserRowItem | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const roles: { value: UserRole; label: string }[] = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'agency_admin', label: 'Agency Admin' },
    { value: 'care_coordinator', label: 'Care Coordinator' },
    { value: 'registered_nurse', label: 'Registered Nurse (RN)' },
    { value: 'caregiver', label: 'Caregiver' },
  ];

  const handleRoleSelectChange = (user: UserRowItem, newRole: UserRole) => {
    // Agency admins cannot promote anyone to super_admin
    if (currentUserRole !== 'super_admin' && newRole === 'super_admin') {
      alert('Only existing Super Administrators can grant the Super Admin role.');
      return;
    }
    setSelectedUser(user);
    setPendingRole(newRole);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser || !pendingRole) return;
    try {
      setIsUpdating(true);
      await onUpdateRole(selectedUser.id, pendingRole);
      setIsConfirmModalOpen(false);
      setSelectedUser(null);
      setPendingRole(null);
    } catch (err: unknown) {
      alert(`Failed to update role: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'danger';
      case 'agency_admin':
        return 'warning';
      case 'care_coordinator':
        return 'info';
      case 'registered_nurse':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" />
            Staff Role & Access Management
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign granular system permissions and enforce multi-tenant state isolation
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3">Staff Member</th>
              <th className="px-6 py-3">Assigned State</th>
              <th className="px-6 py-3">Current Role</th>
              <th className="px-6 py-3">Change Role</th>
              <th className="px-6 py-3">Account Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {errorMessage ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-red-600 bg-red-50/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                    {onRetry && (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Retry loading users
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs">
                  No staff members found.
                </td>
              </tr>
            ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/75 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="font-medium text-slate-900">{user.full_name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-6 py-3.5">
                  <Badge variant="neutral" size="sm">
                    {user.state_code}
                  </Badge>
                </td>
                <td className="px-6 py-3.5">
                  <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                    {user.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-3.5">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleSelectChange(user, e.target.value as UserRole)}
                    className="text-xs border border-slate-200 rounded-md px-2.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {roles.map((r) => (
                      <option
                        key={r.value}
                        value={r.value}
                        disabled={currentUserRole !== 'super_admin' && r.value === 'super_admin'}
                      >
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-3.5">
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      Locked / Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <Button
                    variant={user.is_active ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => onToggleActive(user.id, !user.is_active)}
                    leftIcon={user.is_active ? <UserX className="w-3.5 h-3.5 text-red-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    {user.is_active ? 'Deactivate' : 'Reactivate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Role Mutation */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Role Change"
        description="Changing this staff member's role directly impacts their access to Protected Health Information (PHI)."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmRoleChange}
              isLoading={isUpdating}
            >
              Confirm Role Change
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-sm text-slate-700">
          <p>
            Are you sure you want to promote/reassign <strong>{selectedUser?.full_name}</strong> to:
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              New Role: <strong>{pendingRole?.replace('_', ' ').toUpperCase()}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            This action is logged immutably in the HIPAA security audit log with your user ID and IP address.
          </p>
        </div>
      </Modal>
    </div>
  );
};
