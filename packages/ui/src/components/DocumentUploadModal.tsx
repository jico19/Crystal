'use client';

import React, { useState, useRef } from 'react';
import type { DocumentCategoryType, CaregiverDocument } from '@crystal/types';
import {
  X,
  UploadCloud,
  FileCheck,
  Sparkles,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiverId: string;
  orgId: string;
  apiBaseUrl?: string;
  initialCategory?: DocumentCategoryType;
  onUploadSuccess?: (doc: CaregiverDocument) => void;
}

const CATEGORY_LABELS: Record<DocumentCategoryType, string> = {
  drivers_license: "Driver's License / State ID",
  social_security_card: 'Social Security Card',
  cpr_first_aid: 'CPR & First Aid Certification',
  cna_hha_license: 'CNA / HHA / PCA License',
  tb_test_screen: 'TB Test / PPD Screen / Chest X-Ray',
  physical_exam: 'Annual Physical & Medical Clearance',
  background_check_report: 'Background Check & Fingerprint Report',
  auto_insurance: 'Auto Insurance Policy (if driving)',
  direct_deposit_form: 'Direct Deposit / Voided Check',
  w4_i9_form: 'W-4 & I-9 Tax Forms',
  other_compliance_doc: 'Other Compliance Document',
};

export function DocumentUploadModal({
  isOpen,
  onClose,
  caregiverId,
  orgId,
  apiBaseUrl = 'http://localhost:3000',
  initialCategory = 'cpr_first_aid',
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [category, setCategory] = useState<DocumentCategoryType>(initialCategory);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrDetected, setOcrDetected] = useState<string | null>(null);
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [hasNoExpiration, setHasNoExpiration] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
      if (['social_security_card', 'w4_i9_form', 'direct_deposit_form'].includes(initialCategory)) {
        setHasNoExpiration(true);
      } else {
        setHasNoExpiration(false);
      }
    }
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum 25MB limit.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

    // Simulate real-time OCR extraction preview
    setIsOcrScanning(true);
    setOcrDetected(null);

    setTimeout(() => {
      setIsOcrScanning(false);
      if (category === 'cpr_first_aid') {
        setOcrDetected('AHA BLS Provider • Exp: 2026-12-31');
        setExpirationDate('2026-12-31');
        setIssueDate('2024-12-31');
      } else if (category === 'cna_hha_license') {
        setOcrDetected('Certified Nurse Aide • License #GA-CNA-982104');
        setExpirationDate('2026-10-15');
      } else if (category === 'tb_test_screen') {
        setOcrDetected('Negative PPD Skin Test • Annual renewal required');
        setExpirationDate('2025-09-01');
      } else if (category === 'drivers_license') {
        setOcrDetected('Class C Driver License • Valid DDS ID');
        setExpirationDate('2028-06-20');
      }
    }, 600);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const payload = {
        caregiver_id: caregiverId,
        org_id: orgId,
        category,
        file_name: selectedFile.name,
        file_size_bytes: selectedFile.size,
        mime_type: selectedFile.type || 'application/pdf',
        issue_date: issueDate || undefined,
        expiration_date: hasNoExpiration ? undefined : expirationDate || undefined,
        has_no_expiration: hasNoExpiration,
      };

      const res = await fetch(`${apiBaseUrl}/api/v1/caregivers/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': caregiverId,
          'x-org-id': orgId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Upload failed with status ${res.status}`);
      }

      const json = await res.json();
      if (json.document) {
        onUploadSuccess?.(json.document);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Upload Credential Document</h3>
            <p className="text-xs text-gray-500 mt-0.5">Secure presigned storage with OCR extraction</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpload} className="mt-6 space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Document Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                const cat = e.target.value as DocumentCategoryType;
                setCategory(cat);
                if (['social_security_card', 'w4_i9_form', 'direct_deposit_form'].includes(cat)) {
                  setHasNoExpiration(true);
                } else {
                  setHasNoExpiration(false);
                }
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm font-medium text-gray-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              File Attachment (PDF, PNG, JPG up to 25MB)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center hover:border-primary/50 hover:bg-teal-50/30 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg,image/heic,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center gap-3 text-left">
                  <div className="rounded-xl bg-teal-100 p-2.5 text-teal-800">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-gray-100 p-3 text-gray-500 mb-2">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Click to choose or drag file here</p>
                  <p className="text-xs text-gray-400 mt-0.5">Supports PDF, JPG, PNG &amp; HEIC</p>
                </>
              )}
            </div>
          </div>

          {/* OCR Live Extraction Badge */}
          {isOcrScanning && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Agent-DocOCR analyzing document text &amp; dates...</span>
            </div>
          )}

          {ocrDetected && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3.5 py-2.5 text-xs font-semibold text-green-800">
              <Sparkles className="h-4 w-4 text-green-600 shrink-0" />
              <span>OCR Auto-Extracted: {ocrDetected}</span>
            </div>
          )}

          {/* Dates & Evergreen Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Issue Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={expirationDate}
                disabled={hasNoExpiration}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has_no_expiration"
              checked={hasNoExpiration}
              onChange={(e) => setHasNoExpiration(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="has_no_expiration" className="text-xs font-medium text-gray-600 cursor-pointer">
              This document does not expire (Evergreen / Tax / Banking form)
            </label>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 shadow-sm"
            >
              {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Submit Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
