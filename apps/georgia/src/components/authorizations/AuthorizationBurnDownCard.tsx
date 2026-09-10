import React, { useState } from 'react';
import type { ClientAuthorization } from '@crystal/types';
import { Badge, Button, Input } from '@crystal/ui';
import { AlertTriangle } from 'lucide-react';

export interface AuthorizationBurnDownCardProps {
  authorization: ClientAuthorization & {
    client_first_name?: string;
    client_last_name?: string;
  };
  onDeductUnits: (authId: string, units: number, notes?: string) => Promise<void>;
}

export const AuthorizationBurnDownCard: React.FC<AuthorizationBurnDownCardProps> = ({
  authorization,
  onDeductUnits,
}) => {
  const [isDeducting, setIsDeducting] = useState(false);
  const [deltaUnits, setDeltaUnits] = useState<number>(4); // default 4 units = 1 hr
  const [deductNotes, setDeductNotes] = useState('');
  const [showDeductForm, setShowDeductForm] = useState(false);

  const total = authorization.total_units_authorized;
  const used = authorization.total_units_used;
  const remaining = Math.max(0, total - used);
  const utilizationPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  const now = new Date();
  const endDate = new Date(authorization.end_date);
  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isAtRisk =
    diffDays <= 30 ||
    remaining <= total * 0.15 ||
    utilizationPct >= 85 ||
    authorization.status === 'exhausted' ||
    authorization.status === 'expiring_soon' ||
    authorization.status === 'expired';

  const handleDeduct = async () => {
    if (deltaUnits <= 0) return;
    setIsDeducting(true);
    try {
      await onDeductUnits(authorization.id, deltaUnits, deductNotes);
      setShowDeductForm(false);
      setDeductNotes('');
    } finally {
      setIsDeducting(false);
    }
  };

  const getStatusBadge = () => {
    switch (authorization.status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning" size="sm">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="danger" size="sm">Expired</Badge>;
      case 'exhausted':
        return <Badge variant="danger" size="sm">Units Exhausted</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{authorization.status}</Badge>;
    }
  };

  return (
    <div className={`bg-white rounded-xl border transition-all p-5 shadow-sm ${
      isAtRisk ? 'border-amber-300 ring-1 ring-amber-200' : 'border-neutral-200 hover:border-neutral-300'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-900 text-sm">
              #{authorization.auth_number}
            </span>
            {getStatusBadge()}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Service: <span className="font-semibold text-neutral-700">{authorization.service_code}</span> • Payer: {authorization.payer_id}
          </div>
          {authorization.client_first_name && (
            <div className="text-xs font-medium text-neutral-800 mt-0.5">
              Client: {authorization.client_last_name}, {authorization.client_first_name}
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-xs text-neutral-400 block">End Date</span>
          <span className={`text-xs font-semibold ${diffDays <= 30 ? 'text-rose-600 font-bold' : 'text-neutral-700'}`}>
            {authorization.end_date} ({diffDays > 0 ? `${diffDays}d left` : 'Expired'})
          </span>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="space-y-1.5 my-3">
        <div className="flex justify-between items-center text-xs font-medium">
          <span className="text-neutral-600">
            {used} / {total} units ({used * 15 / 60}h / {total * 15 / 60}h)
          </span>
          <span className={utilizationPct >= 85 ? 'text-rose-600 font-bold' : 'text-neutral-700'}>
            {utilizationPct}% Used
          </span>
        </div>
        <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              utilizationPct >= 90
                ? 'bg-rose-500'
                : utilizationPct >= 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${utilizationPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-neutral-400">
          <span>{remaining} units remaining ({remaining * 15 / 60} hrs)</span>
          {authorization.weekly_unit_cap && (
            <span>Cap: {authorization.weekly_unit_cap} units/wk</span>
          )}
        </div>
      </div>

      {/* At-risk banner if warning */}
      {isAtRisk && (
        <div className="p-2 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
          <span>
            {diffDays <= 30
              ? `Authorization expires in ${diffDays} days. Request re-assessment.`
              : remaining <= total * 0.15
              ? `Low balance alert: only ${remaining} units remaining.`
              : `High utilization: ${utilizationPct}% used.`}
          </span>
        </div>
      )}

      {/* Unit deduction action */}
      {showDeductForm ? (
        <div className="pt-3 border-t border-neutral-100 space-y-2 bg-neutral-50 p-3 rounded-lg mt-2">
          <div className="flex items-center gap-2">
            <div className="w-28">
              <label className="text-[11px] font-semibold text-neutral-600 block mb-0.5">Units (15m ea)</label>
              <Input
                type="number"
                min="1"
                max={remaining}
                value={deltaUnits}
                onChange={(e) => setDeltaUnits(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-neutral-600 block mb-0.5">Notes (e.g. EVV shift)</label>
              <Input
                value={deductNotes}
                onChange={(e) => setDeductNotes(e.target.value)}
                placeholder="Optional visit note"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeductForm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isDeducting || remaining <= 0}
              onClick={handleDeduct}
            >
              {isDeducting ? 'Deducting...' : `Deduct ${deltaUnits} Units (${deltaUnits * 15 / 60}h)`}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">1 unit = 15 minutes</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={remaining <= 0 || authorization.status === 'expired'}
            onClick={() => setShowDeductForm(true)}
            className="text-xs"
          >
            - Log Service Units
          </Button>
        </div>
      )}
    </div>
  );
};
