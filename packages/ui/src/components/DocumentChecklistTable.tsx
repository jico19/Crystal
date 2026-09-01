'use client';

import React, { useState } from 'react';
import type {
  DocumentCategoryType,
  CaregiverDocument,
  DocVerificationStatusType,
} from '@crystal/types';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  UploadCloud,
  Eye,
  ShieldAlert,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface DocumentChecklistTableProps {
  documents: CaregiverDocument[];
  onUploadClick: (category: DocumentCategoryType) => void;
  onReviewSubmit?: (documentId: string, decision: 'approved' | 'rejected', reason?: string) => Promise<void>;
  isCoordinatorView?: boolean;
}

interface CategoryConfig {
  category: DocumentCategoryType;
  title: string;
  description: string;
  isMandatory: boolean;
  renewalPeriod: string;
}

const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    category: 'drivers_license',
    title: "Driver's License / State ID",
    description: 'Valid, unexpired government-issued photo identification.',
    isMandatory: true,
    renewalPeriod: 'Every 4–8 Years',
  },
  {
    category: 'social_security_card',
    title: 'Social Security Card',
    description: 'Signed official Social Security card for payroll & tax verification.',
    isMandatory: true,
    renewalPeriod: 'Evergreen (No Expiry)',
  },
  {
    category: 'cpr_first_aid',
    title: 'CPR & First Aid Certification',
    description: 'AHA or Red Cross approved in-person / blended hands-on certificate.',
    isMandatory: true,
    renewalPeriod: 'Every 2 Years',
  },
  {
    category: 'cna_hha_license',
    title: 'CNA / HHA / PCA License',
    description: 'Active state registry licensing (Georgia DCH / Indiana IPLA).',
    isMandatory: false,
    renewalPeriod: 'Every 2 Years',
  },
  {
    category: 'tb_test_screen',
    title: 'TB Skin Test / Chest X-Ray',
    description: 'Negative 2-step Mantoux PPD test, Quantiferon Gold, or Chest X-Ray.',
    isMandatory: true,
    renewalPeriod: 'Annual Renewal (1 Year)',
  },
  {
    category: 'physical_exam',
    title: 'Annual Physical & Medical Clearance',
    description: 'Fit-for-duty medical exam signed by a licensed physician or NP.',
    isMandatory: true,
    renewalPeriod: 'Annual Renewal (1 Year)',
  },
  {
    category: 'background_check_report',
    title: 'Criminal Background & Fingerprints',
    description: 'State and federal fingerprint background check clearance record.',
    isMandatory: true,
    renewalPeriod: 'Annual / Bi-annual',
  },
  {
    category: 'auto_insurance',
    title: 'Auto Insurance Policy',
    description: 'Proof of active comprehensive auto liability insurance (if driving clients).',
    isMandatory: false,
    renewalPeriod: 'Every 6 Months',
  },
  {
    category: 'direct_deposit_form',
    title: 'Direct Deposit Authorization',
    description: 'Voided check or official bank account verification letter for payroll.',
    isMandatory: false,
    renewalPeriod: 'Evergreen (No Expiry)',
  },
  {
    category: 'w4_i9_form',
    title: 'W-4 & I-9 Verification Forms',
    description: 'Federal tax withholding form and employment eligibility verification.',
    isMandatory: false,
    renewalPeriod: 'Evergreen (No Expiry)',
  },
];

export function DocumentChecklistTable({
  documents,
  onUploadClick,
  onReviewSubmit,
  isCoordinatorView = true,
}: DocumentChecklistTableProps) {
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Map category to uploaded document
  const docMap = new Map<DocumentCategoryType, CaregiverDocument>();
  documents.forEach((d) => {
    if (!docMap.has(d.category) || d.verification_status === 'approved') {
      docMap.set(d.category, d);
    }
  });

  const handleApprove = async (docId: string) => {
    if (!onReviewSubmit) return;
    setIsProcessing(docId);
    try {
      await onReviewSubmit(docId, 'approved');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectConfirm = async (docId: string) => {
    if (!onReviewSubmit) return;
    if (!rejectionReason.trim()) return;
    setIsProcessing(docId);
    try {
      await onReviewSubmit(docId, 'rejected', rejectionReason);
      setRejectingDocId(null);
      setRejectionReason('');
    } finally {
      setIsProcessing(null);
    }
  };

  const renderStatusBadge = (status?: DocVerificationStatusType, doc?: CaregiverDocument) => {
    if (!status || !doc) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          <UploadCloud className="h-3.5 w-3.5 text-gray-400" />
          Missing / Not Uploaded
        </span>
      );
    }

    if (doc.is_expiring_soon && status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          Expiring Soon ({doc.days_until_expiration}d)
        </span>
      );
    }

    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            Verified &amp; Active
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            Needs Replacement
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
            Expired Credential
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Required Compliance Checklist</h3>
          <p className="text-xs text-gray-500">Track and upload state-mandated healthcare credentials</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {CATEGORIES_CONFIG.map((config) => {
          const doc = docMap.get(config.category);
          const hasDoc = Boolean(doc);

          return (
            <div
              key={config.category}
              className="p-5 transition-colors hover:bg-gray-50/50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              {/* Left Column: Category Info */}
              <div className="flex items-start gap-3.5 max-w-xl">
                <div
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    doc?.verification_status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : doc?.verification_status === 'under_review'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{config.title}</h4>
                    {config.isMandatory ? (
                      <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-700">
                        Mandatory
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{config.description}</p>

                  {/* Document Meta Row */}
                  {doc && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">📄 {doc.file_name}</span>
                      {doc.ocr_extracted_data?.license_number && (
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 font-medium text-purple-700">
                          ID: {doc.ocr_extracted_data.license_number}
                        </span>
                      )}
                      {doc.expiration_date && (
                        <span className="text-gray-500">
                          Expires: <strong className="text-gray-800">{doc.expiration_date}</strong>
                        </span>
                      )}
                      {doc.has_no_expiration && (
                        <span className="text-gray-500">Evergreen (No Expiration)</span>
                      )}
                      {doc.ocr_extracted_data?.confidence_score && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          <Sparkles className="h-3 w-3" />
                          OCR {(doc.ocr_extracted_data.confidence_score * 100).toFixed(0)}% Match
                        </span>
                      )}
                    </div>
                  )}

                  {doc?.rejection_reason && (
                    <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 border border-red-200">
                      <strong>Rejection Reason:</strong> {doc.rejection_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Status & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                {renderStatusBadge(doc?.verification_status, doc)}

                {/* Upload / Re-Upload Button */}
                <button
                  type="button"
                  onClick={() => onUploadClick(config.category)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-gray-500" />
                  {hasDoc ? 'Replace File' : 'Upload'}
                </button>

                {/* Coordinator 1-Click Verification Toggle */}
                {isCoordinatorView && doc && doc.verification_status === 'under_review' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isProcessing === doc.id}
                      onClick={() => handleApprove(doc.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors shadow-2xs disabled:opacity-50"
                      title="1-Click Approve"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing === doc.id}
                      onClick={() => setRejectingDocId(doc.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      title="Reject with Reason"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-gray-900">Reject Credential Document</h4>
            <p className="mt-1 text-xs text-gray-500">
              Provide a clear reason for the caregiver to replace this document (e.g., blurry photo, expired CPR).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Document image is blurry and expiration date is unreadable."
              className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingDocId(null);
                  setRejectionReason('');
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectionReason.trim().length < 5 || isProcessing === rejectingDocId}
                onClick={() => handleRejectConfirm(rejectingDocId)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
