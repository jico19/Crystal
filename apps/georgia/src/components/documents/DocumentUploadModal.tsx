import React, { useState } from 'react';
import type { DocumentCategory } from '@crystal/types';
import { Modal, Button, Input } from '@crystal/ui';
import { UploadCloud, FileCheck, AlertCircle } from 'lucide-react';

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: DocumentCategory;
  categoryLabel: string;
  onUpload: (file: File, expirationDate?: string, hasNoExpiration?: boolean) => Promise<void>;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  categoryLabel,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [hasNoExpiration, setHasNoExpiration] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        setError('File exceeds maximum allowed size of 25MB');
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!hasNoExpiration && !expirationDate) {
      setError('Please provide the document expiration date or check "No Expiration Date"');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await onUpload(file, hasNoExpiration ? undefined : expirationDate, hasNoExpiration);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload ${categoryLabel}`}
      description="Accepted formats: PDF, PNG, JPG (Max size 25MB)"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary-500 transition-colors bg-slate-50/50">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            {file ? (
              <FileCheck className="w-10 h-10 text-emerald-600 mb-2" />
            ) : (
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
            )}
            <span className="text-sm font-semibold text-slate-800">
              {file ? file.name : 'Click to select or drag document here'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Secure HIPAA-compliant encrypted storage'}
            </span>
          </label>
        </div>

        {/* Expiration date */}
        <div className="space-y-2">
          <Input
            type="date"
            label="Document Expiration Date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            disabled={hasNoExpiration}
            required={!hasNoExpiration}
          />

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={hasNoExpiration}
              onChange={(e) => setHasNoExpiration(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>This document has no expiration date (e.g. Social Security card, W-4)</span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isUploading} disabled={!file}>
            Submit for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
