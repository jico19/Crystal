import { INDIANA_ORGANIZATION } from '../../lib/organization';
import { Metadata } from 'next';
import { IndianaTrainingClient } from './IndianaTrainingClient';

export const metadata: Metadata = {
  title: 'Caregiver In-Service Training Portal | Cherish Open Arms Indiana',
  description:
    'Complete annual FSSA state-mandated home care continuing education modules and earn certified credits.',
};

export default function IndianaTrainingPage() {
  const org = INDIANA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <IndianaTrainingClient orgId={org.id} stateCode={org.state_code} />
      </div>
    </div>
  );
}
