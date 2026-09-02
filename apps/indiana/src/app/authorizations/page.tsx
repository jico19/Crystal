import { Metadata } from 'next';
import { INDIANA_ORGANIZATION } from '../../lib/organization';
import { IndianaAuthorizationsClient } from './IndianaAuthorizationsClient';

export const metadata: Metadata = {
  title: 'Client Prior Authorizations & Utilization | Cherish Open Arms Indiana',
  description:
    'Monitor Indiana FSSA A&D Waiver units burn-down, procedure codes, weekly caps, and renewals.',
};

export default function IndianaAuthorizationsPage() {
  const org = INDIANA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <IndianaAuthorizationsClient orgId={org.id} />
      </div>
    </div>
  );
}
