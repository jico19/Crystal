import React, { useState } from 'react';
import type { ClientStatus } from '@crystal/types';
import { Badge, Button } from '@crystal/ui';
import { Search, Plus, Eye } from 'lucide-react';

export interface ClientRowItem {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  medicaid_id?: string | null;
  status: ClientStatus;
  active_authorizations_count?: number;
  documents_count?: number;
  created_at: string;
}

export interface ClientRosterTableProps {
  clients: ClientRowItem[];
  isLoading?: boolean;
  onViewClient: (client: ClientRowItem) => void;
  onNewIntake: () => void;
  onAddAuthorization?: (client: ClientRowItem) => void;
}

export const ClientRosterTable: React.FC<ClientRosterTableProps> = ({
  clients,
  isLoading = false,
  onViewClient,
  onNewIntake,
  onAddAuthorization,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredClients = clients.filter((c) => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      fullName.includes(searchTerm.toLowerCase()) ||
      (c.medicaid_id && c.medicaid_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ClientStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'submitted':
        return <Badge variant="info" size="sm">Submitted</Badge>;
      case 'intake_draft':
        return <Badge variant="warning" size="sm">Draft</Badge>;
      case 'suspended':
        return <Badge variant="danger" size="sm">Suspended</Badge>;
      case 'discharged':
        return <Badge variant="neutral" size="sm">Discharged</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* Header controls */}
      <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/50">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name or Medicaid ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="submitted">Submitted</option>
            <option value="intake_draft">Draft</option>
            <option value="suspended">Suspended</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={onNewIntake}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Client Intake
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-600">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Client Name</th>
              <th className="px-6 py-3 font-semibold">Medicaid ID</th>
              <th className="px-6 py-3 font-semibold">DOB</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-center">Active Auths</th>
              <th className="px-6 py-3 font-semibold text-center">Docs</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-neutral-600">
                  Loading clients...
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-neutral-600">
                  No clients found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">
                      {client.last_name}, {client.first_name}
                    </div>
                    <div className="text-xs text-neutral-600 capitalize">{client.gender}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-neutral-700">
                    {client.medicaid_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-600">
                    {client.dob}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(client.status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {client.active_authorizations_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                      {client.documents_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onAddAuthorization && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onAddAuthorization(client)}
                          title="Add Prior Authorization"
                        >
                          + Auth
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewClient(client)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
