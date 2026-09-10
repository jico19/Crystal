import React, { useState } from 'react';
import type { ClientAuthorization } from '@crystal/types';
import { AuthorizationBurnDownCard } from './AuthorizationBurnDownCard.js';
import { Button } from '@crystal/ui';
import { Plus, Filter } from 'lucide-react';

export interface ClientAuthorizationsListProps {
  authorizations: Array<ClientAuthorization & { client_first_name?: string; client_last_name?: string }>;
  onDeductUnits: (authId: string, units: number, notes?: string) => Promise<void>;
  onNewAuthorization?: () => void;
  isLoading?: boolean;
}

export const ClientAuthorizationsList: React.FC<ClientAuthorizationsListProps> = ({
  authorizations,
  onDeductUnits,
  onNewAuthorization,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'at_risk' | 'expired'>('all');

  const filteredAuths = authorizations.filter((auth) => {
    if (filter === 'active') return auth.status === 'active';
    if (filter === 'expired') return auth.status === 'expired' || auth.status === 'exhausted';
    if (filter === 'at_risk') {
      const now = new Date();
      const end = new Date(auth.end_date);
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, auth.total_units_authorized - auth.total_units_used);
      return (
        diffDays <= 30 ||
        remaining <= auth.total_units_authorized * 0.15 ||
        auth.status === 'expiring_soon' ||
        auth.status === 'exhausted'
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-700">Filter:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              All ({authorizations.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('at_risk')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === 'at_risk'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              At-Risk
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === 'expired'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              Expired/Exhausted
            </button>
          </div>
        </div>

        {onNewAuthorization && (
          <Button
            variant="primary"
            size="sm"
            onClick={onNewAuthorization}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Authorization
          </Button>
        )}
      </div>

      {/* Grid of Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-neutral-600 bg-white rounded-xl border border-neutral-200">
          Loading authorizations...
        </div>
      ) : filteredAuths.length === 0 ? (
        <div className="p-12 text-center text-sm text-neutral-600 bg-white rounded-xl border border-neutral-200">
          No authorizations found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAuths.map((auth) => (
            <AuthorizationBurnDownCard
              key={auth.id}
              authorization={auth}
              onDeductUnits={onDeductUnits}
            />
          ))}
        </div>
      )}
    </div>
  );
};
