import { GEORGIA_ORGANIZATION } from '../../lib/organization';
import { Metadata } from 'next';
import { GeorgiaTrainingClient } from './GeorgiaTrainingClient';

export const metadata: Metadata = {
  title: 'Caregiver In-Service Training Portal | With Open Hands Georgia',
  description:
    'Complete annual state-mandated home care continuing education modules and earn certified credits.',
};

export default function GeorgiaTrainingPage() {
  const org = GEORGIA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <GeorgiaTrainingClient orgId={org.id} stateCode={org.state_code} />
      </div>
    </div>
  );
}
