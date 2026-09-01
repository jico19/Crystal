import { INDIANA_ORGANIZATION } from '../../lib/organization';
import { Metadata } from 'next';
import { IndianaApplyClient } from './IndianaApplyClient';

export const metadata: Metadata = {
  title: 'Apply to Join Our Team | Cherish Open Arms Indiana',
  description:
    'Apply to become a caregiver with Cherish Open Arms. Join our dedicated team serving Indiana families.',
};

export default function IndianaApplyPage() {
  const org = INDIANA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Join Our Team
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Caregiver Application
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Join the Cherish Open Arms team and make a meaningful difference in the lives of Indiana
            families. Your application progress is automatically saved.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>🏢 {org.name}</span>
            <span>📍 Indianapolis, IN</span>
            <span>📞 {org.contact_phone}</span>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IndianaApplyClient orgId={org.id} stateCode={org.state_code} />
      </div>
    </div>
  );
}
