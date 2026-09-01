'use client';

import * as React from 'react';
import { ShieldCheck, Copy, Check, FileCheck, Hash } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CertificateOfCompletionBadgeProps {
  signerName: string;
  signerEmail: string;
  signedAt: string;
  documentHash: string;
  envelopeId?: string;
  title?: string;
  className?: string;
}

/**
 * CertificateOfCompletionBadge
 *
 * Displays a legally-binding electronic signature certificate badge featuring:
 * - Green verified shield certification
 * - Signer identity & audit timestamp
 * - Cryptographic SHA-256 tamper-evident digest
 * - Federal ESIGN Act & Uniform Electronic Transactions Act (UETA) compliance statement
 */
export function CertificateOfCompletionBadge({
  signerName,
  signerEmail,
  signedAt,
  documentHash,
  envelopeId,
  title = 'Electronic Document Completion Certificate',
  className,
}: CertificateOfCompletionBadgeProps) {
  const [copied, setCopied] = React.useState(false);

  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(signedAt);
      if (isNaN(d.getTime())) return signedAt;
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(d);
    } catch {
      return signedAt;
    }
  }, [signedAt]);

  const handleCopyHash = async () => {
    if (!documentHash) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(documentHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* clipboard write may fail in non-secure context */
    }
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-6 shadow-sm',
        className
      )}
    >
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                Verified &amp; Certified
              </span>
              {envelopeId && (
                <span className="text-xs text-gray-400 font-mono">
                  ID: {envelopeId}
                </span>
              )}
            </div>
            <h3 className="mt-1 text-base font-bold text-gray-900">{title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-lg w-fit">
          <FileCheck className="h-4 w-4 text-emerald-700" />
          <span>Legally Binding Digital Record</span>
        </div>
      </div>

      {/* Certificate Details Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Signer Name
          </p>
          <p className="font-semibold text-gray-900">{signerName}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Signer Email
          </p>
          <p className="font-medium text-gray-700">{signerEmail}</p>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Timestamp of Execution
          </p>
          <p className="font-medium text-gray-800">{formattedDate}</p>
          <p className="text-xs font-mono text-gray-400">{signedAt}</p>
        </div>
      </div>

      {/* SHA-256 Tamper-Evident Cryptographic Stamp */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-900 p-4 text-white shadow-inner">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Hash className="h-3.5 w-3.5" />
            <span>SHA-256 Cryptographic Document Hash</span>
          </div>
          <button
            type="button"
            onClick={handleCopyHash}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            title="Copy SHA-256 Hash"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Hash</span>
              </>
            )}
          </button>
        </div>
        <p className="break-all font-mono text-xs text-gray-200 selection:bg-emerald-500 selection:text-black">
          {documentHash}
        </p>
        <p className="mt-2 text-[11px] text-gray-400">
          This digital hash is generated immutably at the moment of signature. Any modification to the underlying agreement invalidates this digest.
        </p>
      </div>

      {/* Legal & Regulatory Compliance Notice */}
      <div className="mt-5 rounded-lg border border-gray-200 bg-white/80 p-3.5 text-[11px] text-gray-500 leading-relaxed">
        <p className="font-semibold text-gray-700 mb-0.5">
          ESIGN Act (15 U.S.C. § 7001) &amp; UETA Compliant
        </p>
        <p>
          This electronic record and signature are legally binding and enforceable pursuant to the Electronic Signatures in Global and National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA). The signer provided express consent to conduct transactions electronically.
        </p>
      </div>
    </div>
  );
}
