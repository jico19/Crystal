'use client';

import React, { useState } from 'react';
import type { CreateAuthorizationInput } from '@crystal/types';

export interface CreateAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  orgId: string;
  defaultPayerName?: string;
  onSubmit: (input: CreateAuthorizationInput) => Promise<{ success: boolean; error?: string }>;
}

export const CreateAuthorizationModal: React.FC<CreateAuthorizationModalProps> = ({
  isOpen,
  onClose,
  clientId,
  orgId,
  defaultPayerName = 'Medicaid Waiver',
  onSubmit,
}) => {
  const [payerName, setPayerName] = useState(defaultPayerName);
  const [authorizationNumber, setAuthorizationNumber] = useState('');
  const [procedureCode, setProcedureCode] = useState('T1019');
  const [serviceType, setServiceType] = useState('Personal Support Services');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0] // 6 months default
  );
  const [totalUnits, setTotalUnits] = useState(400); // 100 hrs
  const [weeklyCap, setWeeklyCap] = useState<number | undefined>(20);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalHours = (totalUnits / 4).toFixed(1);

  const handleProcedureCodeChange = (code: string) => {
    setProcedureCode(code);
    if (code === 'T1019') setServiceType('Personal Support Services');
    else if (code === 'S5125') setServiceType('Attendant Care Services');
    else if (code === 'S5130') setServiceType('Homemaker & Chore Support');
    else if (code === 'T1005') setServiceType('Respite Care Services');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (new Date(endDate) <= new Date(startDate)) {
      setErrorMsg('End date must be strictly after start date.');
      return;
    }

    if (totalUnits <= 0) {
      setErrorMsg('Total units authorized must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await onSubmit({
        client_id: clientId,
        org_id: orgId,
        payer_name: payerName,
        authorization_number: authorizationNumber,
        procedure_code: procedureCode,
        service_type: serviceType,
        start_date: startDate,
        end_date: endDate,
        total_units_authorized: Number(totalUnits),
        weekly_hours_cap: weeklyCap ? Number(weeklyCap) : undefined,
        notes: notes || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to create authorization.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-teal-400 font-semibold">
              Medicaid & Payer Authorizations
            </span>
            <h3 className="text-lg font-bold">Add Prior Authorization (PA)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Georgia Medicaid / CCSP"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authorization # (PA) *</label>
              <input
                type="text"
                required
                placeholder="e.g. GA-PA-2026-891"
                value={authorizationNumber}
                onChange={(e) => setAuthorizationNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Procedure Code *</label>
              <select
                value={procedureCode}
                onChange={(e) => handleProcedureCodeChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              >
                <option value="T1019">T1019 - Personal Support Services</option>
                <option value="S5125">S5125 - Attendant Care Services</option>
                <option value="S5130">S5130 - Homemaker Services</option>
                <option value="T1005">T1005 - Respite Care</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title</label>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Units Authorized * (1 unit = 15m)
              </label>
              <input
                type="number"
                min={1}
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm font-semibold"
              />
              <span className="text-[11px] text-teal-700 font-medium mt-1 block">
                &asymp; {totalHours} total billable care hours
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weekly Hours Cap (Optional)
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 20"
                value={weeklyCap || ''}
                onChange={(e) => setWeeklyCap(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Prevents caregiver over-scheduling
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Case Manager</label>
            <textarea
              rows={2}
              placeholder="e.g. Authorized by Case Manager Sarah Jenkins for morning ADL care."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all disabled:bg-slate-300"
            >
              {submitting ? 'Creating...' : 'Save Authorization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
