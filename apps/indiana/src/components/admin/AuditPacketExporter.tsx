import React, { useState } from 'react';
import { Button } from '@crystal/ui';
import { Download, FileSpreadsheet, CheckCircle2, Shield } from 'lucide-react';
import api from '../../lib/api.js';

export interface AuditPacketExporterProps {
  defaultStateCode?: string;
}

export const AuditPacketExporter: React.FC<AuditPacketExporterProps> = ({
  defaultStateCode = 'ALL',
}) => {
  const [selectedState, setSelectedState] = useState(defaultStateCode);
  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setDownloaded(false);
    setErrorMsg(null);

    try {
      const res = await api.get('/api/v1/admin/export/audit-packet', {
        params: { state_code: selectedState },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `state_survey_audit_packet_${selectedState}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 4000);
    } catch (err: unknown) {
      console.error('Failed to download audit packet CSV via Axios:', err);
      setErrorMsg('Export failed. Ensure admin session is active.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-900">
              State Survey Audit Packet Exporter
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="w-2.5 h-2.5" /> DCH / FSSA / AHCA
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Export comprehensive regulatory compliance binder including verified caregiver licenses, 485 plans of care, and authorization ledger in CSV format.
          </p>
          {errorMsg && <p className="text-xs text-rose-600 font-semibold mt-1">{errorMsg}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-neutral-50 font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All States (Consolidated)</option>
          <option value="GA">Georgia (With Open Hands)</option>
          <option value="IN">Indiana (Cherish Open Arms)</option>
          <option value="FL">Florida (Sun Coast Care)</option>
        </select>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="primary"
          size="sm"
          className="flex items-center gap-1.5 text-xs whitespace-nowrap bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Packet Downloaded
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {isExporting ? 'Generating...' : 'Export Audit Packet'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
