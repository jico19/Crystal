import { Metadata } from 'next';
import { GEORGIA_ORGANIZATION } from '../../lib/organization';
import { GeorgiaAuthorizationsClient } from './GeorgiaAuthorizationsClient';

export const metadata: Metadata = {
  title: 'Client Prior Authorizations & Utilization | With Open Hands Georgia',
  description:
    'Monitor Georgia Medicaid CCSP/SOURCE units burn-down, procedure codes, weekly caps, and renewals.',
};

export default function GeorgiaAuthorizationsPage() {
  const org = GEORGIA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <GeorgiaAuthorizationsClient orgId={org.id} />
      </div>
    </div>
  );
}
