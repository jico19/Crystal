import { Metadata } from 'next';
import { IndianaAdminClient } from './IndianaAdminClient';

export const metadata: Metadata = {
  title: 'Executive Command Center | Cherish Open Arms Indiana',
  description:
    'Indiana state director command center for caregiver credential compliance, client rosters, and FSSA regulatory audit packets.',
};

export default function IndianaAdminPage() {
  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <IndianaAdminClient />
      </div>
    </div>
  );
}
