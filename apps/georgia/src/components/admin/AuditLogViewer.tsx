import React, { useState } from 'react';
import type { SecurityAuditLog, SecurityAuditEventType } from '@crystal/types';
import { Badge } from '@crystal/ui';
import { Modal } from '@crystal/ui';
import { Button } from '@crystal/ui';
import { Activity, Search, Filter, RefreshCw, Eye } from 'lucide-react';

export interface AuditLogViewerProps {
  logs: SecurityAuditLog[];
  total: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (newPage: number) => void;
  onFilterChange: (filters: { eventType?: SecurityAuditEventType; search?: string }) => void;
  onRefresh: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  total,
  currentPage,
  pageSize,
  isLoading = false,
  onPageChange,
  onFilterChange,
  onRefresh,
}) => {
  const [selectedLog, setSelectedLog] = useState<SecurityAuditLog | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const eventTypes: { value: SecurityAuditEventType | ''; label: string }[] = [
    { value: '', label: 'All Event Types' },
    { value: 'PHI_ACCESS', label: 'PHI Access' },
    { value: 'PII_DECRYPT', label: 'PII Decrypt' },
    { value: 'DOCUMENT_DOWNLOAD', label: 'Document Download' },
    { value: 'AUTH_LOGIN', label: 'Auth Login' },
    { value: 'AUTH_FAILED', label: 'Auth Failed' },
    { value: 'AUTH_LOCKOUT', label: 'Auth Lockout' },
    { value: 'SECURITY_VIOLATION', label: 'Security Violation' },
    { value: 'RECORD_MUTATION', label: 'Record Mutation' },
    { value: 'ROLE_CHANGE', label: 'Role Change' },
  ];

  const handleFilterApply = () => {
    onFilterChange({
      eventType: eventTypeFilter ? (eventTypeFilter as SecurityAuditEventType) : undefined,
      search: searchQuery || undefined,
    });
  };

  const getEventBadgeVariant = (eventType: SecurityAuditEventType) => {
    switch (eventType) {
      case 'AUTH_LOCKOUT':
      case 'SECURITY_VIOLATION':
        return 'danger';
      case 'AUTH_FAILED':
        return 'warning';
      case 'PHI_ACCESS':
      case 'PII_DECRYPT':
        return 'info';
      case 'AUTH_LOGIN':
      case 'ROLE_CHANGE':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-600" />
            HIPAA Security & Access Audit Trail
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all PHI inspections, authentication events, and data mutations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by User ID, Resource ID, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {eventTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>

        <Button variant="secondary" size="sm" onClick={handleFilterApply}>
          Filter
        </Button>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Event Type</th>
              <th className="px-6 py-3">Resource Target</th>
              <th className="px-6 py-3">Actor / IP Address</th>
              <th className="px-6 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No audit log entries matching current criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isCritical = log.event_type === 'AUTH_LOCKOUT' || log.event_type === 'SECURITY_VIOLATION';
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer transition-colors ${
                      isCritical ? 'bg-red-50/40 hover:bg-red-50/80' : 'hover:bg-slate-50/75'
                    }`}
                  >
                    <td className="px-6 py-3 font-mono text-slate-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={getEventBadgeVariant(log.event_type)} size="sm">
                        {log.event_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-slate-800">{log.resource_type}</span>
                      {log.resource_id && (
                        <span className="block font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
                          {log.resource_id}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-mono text-slate-700 truncate max-w-[140px]">
                        {log.user_id ? `usr_${log.user_id.substring(0, 8)}...` : 'System / Anonymous'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.ip_address || 'internal'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({total} total audit records)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Metadata Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Detail & Metadata"
        maxWidth="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
            Close
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block">Record ID</span>
                <span className="font-mono font-medium text-slate-800">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp</span>
                <span className="font-medium text-slate-800">{new Date(selectedLog.created_at).toISOString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Event Type</span>
                <Badge variant={getEventBadgeVariant(selectedLog.event_type)} size="sm">
                  {selectedLog.event_type}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block">Actor User ID</span>
                <span className="font-mono text-slate-800">{selectedLog.user_id || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">IP Address</span>
                <span className="font-mono text-slate-800">{selectedLog.ip_address || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Organization ID</span>
                <span className="font-mono text-slate-800">{selectedLog.org_id || 'Global'}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">User Agent</span>
              <p className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[11px] text-slate-600 break-all">
                {selectedLog.user_agent || 'Unknown'}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Sanitized Metadata Payload</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto font-mono text-[11px] max-h-60">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
