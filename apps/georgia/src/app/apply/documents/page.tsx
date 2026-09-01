import { Metadata } from 'next';
import { Suspense } from 'react';
import { GEORGIA_ORGANIZATION } from '../../../lib/organization';
import { GeorgiaDocumentsClient } from './GeorgiaDocumentsClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Caregiver Credential Documents | With Open Hands Georgia',
  description: 'Upload and verify state-mandated healthcare credentials and certifications for Georgia home care.',
};

export default function GeorgiaDocumentsPage() {
  const org = GEORGIA_ORGANIZATION;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
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
            <span>📍 Atlanta, GA</span>
            <span>📞 {org.contact_phone}</span>
          </div>
        </div>
      </div>

      {/* Client Dashboard */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          }
        >
          <GeorgiaDocumentsClient orgId={org.id} />
        </Suspense>
      </div>
    </div>
  );
}
