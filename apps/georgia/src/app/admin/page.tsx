import { Metadata } from 'next';
import { GeorgiaAdminClient } from './GeorgiaAdminClient';

export const metadata: Metadata = {
  title: 'Executive Command Center | With Open Hands Georgia',
  description:
    'Georgia state director command center for caregiver credential compliance, client rosters, and DCH regulatory audit packets.',
};

export default function GeorgiaAdminPage() {
  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <GeorgiaAdminClient />
      </div>
    </div>
  );
}
