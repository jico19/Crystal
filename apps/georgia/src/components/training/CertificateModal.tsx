import React from 'react';
import type { CertificateDetails } from '@crystal/types';
import { Modal, Button } from '@crystal/ui';
import { Award, Printer, ShieldCheck } from 'lucide-react';

export interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateDetails | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified In-Service Training Certificate"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 font-mono">
            ID: {certificate.certificate_id.substring(0, 18)}...
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Certificate
            </Button>
          </div>
        </div>
      }
    >
      {/* Printable Certificate Sheet */}
      <div className="p-8 border-4 border-double border-slate-300 rounded-2xl bg-gradient-to-b from-slate-50/50 to-white text-center space-y-6 shadow-xs">
        <div className="flex items-center justify-center gap-2 text-primary-700">
          <Award className="w-10 h-10 stroke-[1.5]" />
        </div>

        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
            {certificate.organization_name}, State of {certificate.state_code}
          </span>
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Certificate of In-Service Completion
          </h2>
          <p className="text-xs text-slate-500 italic">
            This certifies that
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold text-primary-900 underline decoration-primary-300 decoration-2 underline-offset-8">
            {certificate.caregiver_name}
          </h3>
          <p className="text-xs text-slate-600 mt-3">
            has successfully completed the mandatory state home care training module:
          </p>
          <p className="text-base font-semibold text-slate-900 mt-1">
            "{certificate.module_title}"
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Hours Credit</span>
            <span className="font-semibold text-slate-800">{certificate.required_hours} CEU Hour</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Score Achieved</span>
            <span className="font-semibold text-emerald-700">{certificate.highest_score}% (Passed)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Date Issued</span>
            <span className="font-semibold text-slate-800">
              {new Date(certificate.completed_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* SHA-256 Tamper Verification Footer */}
        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1 text-left">
          <div className="flex items-center gap-1 font-semibold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cryptographic Verification Digest (SHA-256)</span>
          </div>
          <p className="font-mono text-[9px] text-slate-500 break-all bg-slate-100/70 p-2 rounded border border-slate-200">
            {certificate.certificate_hash}
          </p>
          <p className="italic text-[9px] text-slate-400">
            Certified tamper-evident under Crystal Home Care Learning Management System compliance audit standards.
          </p>
        </div>
      </div>
    </Modal>
  );
};
