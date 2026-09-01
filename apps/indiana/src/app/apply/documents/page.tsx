import { Metadata } from 'next';
import { Suspense } from 'react';
import { INDIANA_ORGANIZATION } from '../../../lib/organization';
import { IndianaDocumentsClient } from './IndianaDocumentsClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Caregiver Credential Documents | Cherish Open Arms Indiana',
  description: 'Upload and verify state-mandated healthcare credentials and certifications for Indiana home care.',
};

export default function IndianaDocumentsPage() {
  const org = INDIANA_ORGANIZATION;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Onboarding &amp; Compliance
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Caregiver Credential Vault
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Upload required licensing, CPR certifications, and medical clearances. Our automated OCR scanner extracts certificate numbers and expiration dates instantly.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>🏢 {org.name}</span>
            <span>📍 Indianapolis, IN</span>
            <span>📞 {org.contact_phone}</span>
          </div>
        </div>
      </div>

      {/* Client Dashboard */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <IndianaDocumentsClient orgId={org.id} />
        </Suspense>
      </div>
    </div>
  );
}
