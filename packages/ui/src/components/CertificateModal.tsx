'use client';

import React from 'react';

export interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiverName: string;
  moduleTitle: string;
  hoursCredited: number;
  completedAt: string;
  certificateHash: string;
  organizationName?: string;
  stateCode?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  caregiverName,
  moduleTitle,
  hoursCredited,
  completedAt,
  certificateHash,
  organizationName = 'Crystal Multi-State Home Care Network',
  stateCode = 'GA',
}) => {
  if (!isOpen) return null;

  const formattedDate = new Date(completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Verified Continuing Education Certificate
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Certificate Paper Frame */}
        <div className="p-8 md:p-12 bg-gradient-to-b from-white to-amber-50/20 text-center relative border-8 border-double border-amber-800/20 m-4 rounded-xl">
          {/* Watermark Seal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.03] pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="none" />
              <path d="M50 15 L60 40 L88 40 L65 57 L74 85 L50 68 L26 85 L35 57 L12 40 L40 40 Z" />
            </svg>
          </div>

          <div className="text-xs uppercase tracking-widest text-amber-900/70 font-semibold mb-2">
            {organizationName}
          </div>
          <div className="text-xs text-slate-500 font-medium tracking-wider uppercase mb-6">
            In-Service Training & Compliance Division • State of {stateCode}
          </div>

          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight mb-2">
            Certificate of Completion
          </h2>
          <div className="w-24 h-0.5 bg-amber-700/40 mx-auto mb-6" />

          <p className="text-sm text-slate-600 mb-2 italic">This is to certify that</p>
          <div className="text-2xl md:text-3xl font-serif font-bold text-indigo-950 mb-4 border-b border-slate-300 pb-1 inline-block min-w-[280px]">
            {caregiverName}
          </div>

          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-2">
            has satisfactorily completed the state-mandated training module:
          </p>

          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
            {moduleTitle}
          </h3>

          <p className="text-xs text-slate-600 mb-8">
            awarding <span className="font-semibold text-slate-900">{hoursCredited} Continuing Education Unit (CEU)</span> in compliance with state annual home care education mandates.
          </p>

          {/* Signatures & Seal Grid */}
          <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto pt-6 border-t border-slate-200 mb-8">
            <div className="text-center">
              <div className="font-serif italic text-base text-slate-800 border-b border-slate-300 pb-1 mb-1">
                Elena Rostova, RN
              </div>
              <div className="text-xs text-slate-500 font-medium">Director of Clinical Training</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-sm text-slate-800 border-b border-slate-300 pb-1 mb-1">
                {formattedDate}
              </div>
              <div className="text-xs text-slate-500 font-medium">Issue Date</div>
            </div>
          </div>

          {/* Verification Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>VERIFIED TAMPER-EVIDENT RECORD</span>
            </div>
            <span className="truncate max-w-xs text-slate-700">
              HASH: {certificateHash.slice(0, 24)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
