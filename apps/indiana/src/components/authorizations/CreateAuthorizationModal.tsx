import React, { useState } from 'react';
import { Button, Input } from '@crystal/ui';
import { CreateAuthorizationSchema, type CreateAuthorizationInput } from '@crystal/validation';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export interface CreateAuthorizationModalProps {
  clientId: string;
  clientName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAuthorizationInput) => Promise<void>;
}

export const CreateAuthorizationModal: React.FC<CreateAuthorizationModalProps> = ({
  clientId,
  clientName,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [authNumber, setAuthNumber] = useState('');
  const [payerId, setPayerId] = useState('');
  const [serviceCode, setServiceCode] = useState('T1019');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalUnits, setTotalUnits] = useState<number>(400); // 100 hours default
  const [weeklyCap, setWeeklyCap] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalHours = Math.round((totalUnits * 15) / 60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsed = CreateAuthorizationSchema.safeParse({
        client_id: clientId,
        auth_number: authNumber,
        payer_id: payerId,
        service_code: serviceCode,
        start_date: startDate,
        end_date: endDate,
        total_units_authorized: Number(totalUnits),
        weekly_unit_cap: weeklyCap ? Number(weeklyCap) : undefined,
        notes: notes || undefined,
      });

      if (!parsed.success) {
        setErrorMsg(parsed.error.errors[0]?.message || 'Validation failed');
        setIsSubmitting(false);
        return;
      }

      await onSubmit(parsed.data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-auth-modal-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-200"
      >
        <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-auth-modal-title" className="text-base font-bold text-neutral-900">Add Prior Authorization</h2>
              {clientName && <p className="text-xs text-neutral-500">Client: {clientName}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Authorization # *</label>
              <Input
                value={authNumber}
                onChange={(e) => setAuthNumber(e.target.value)}
                placeholder="e.g. AUTH-2026-9901"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Payer ID / Name *</label>
              <Input
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                placeholder="e.g. Amerigroup / GA Medicaid"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Service Code *</label>
            <select
              value={serviceCode}
              onChange={(e) => setServiceCode(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="T1019">T1019 - Personal Care Services (1 unit = 15m)</option>
              <option value="S5125">S5125 - Attendant Care Services (1 unit = 15m)</option>
              <option value="T1002">T1002 - RN Clinical Assessment (1 unit = 15m)</option>
              <option value="T1003">T1003 - LPN Skilled In-Home Care (1 unit = 15m)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Start Date *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">End Date *</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Total Units Authorized *</label>
              <Input
                type="number"
                min="1"
                value={totalUnits}
                onChange={(e) => setTotalUnits(parseInt(e.target.value, 10) || 0)}
                required
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                = {totalHours} total care hours
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Weekly Unit Cap (Optional)</label>
              <Input
                type="number"
                min="1"
                value={weeklyCap || ''}
                onChange={(e) => setWeeklyCap(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="e.g. 100 (= 25 hrs/wk)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">Clinical / Authorization Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Waiver CCSP approved for max 25 hrs weekly"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Authorization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
