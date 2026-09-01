import { GEORGIA_ORGANIZATION } from '../../lib/organization';
import { Metadata } from 'next';
import { GeorgiaApplyClient } from './GeorgiaApplyClient';

export const metadata: Metadata = {
  title: 'Apply to Join Our Team | With Open Hands Georgia',
  description:
    'Apply to become a caregiver with With Open Hands. Join our compassionate team serving Georgia families.',
};

export default function GeorgiaApplyPage() {
  const org = GEORGIA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
              Join Our Team
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Caregiver Application
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Join the With Open Hands team and make a meaningful difference in the lives of Georgia
            families. Your application progress is automatically saved.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>🏢 {org.name}</span>
            <span>📍 Atlanta, GA</span>
            <span>📞 {org.contact_phone}</span>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GeorgiaApplyClient orgId={org.id} stateCode={org.state_code} />
      </div>
    </div>
  );
}
