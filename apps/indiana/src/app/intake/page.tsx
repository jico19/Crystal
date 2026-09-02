import { INDIANA_ORGANIZATION } from '../../lib/organization';
import { Metadata } from 'next';
import { IndianaIntakeClient } from './IndianaIntakeClient';

export const metadata: Metadata = {
  title: 'Client Intake & Care Admission | Cherish Open Arms Indiana',
  description:
    'Begin in-home personal care or companion services with Cherish Open Arms. Complete our digital admission packet.',
};

export default function IndianaIntakePage() {
  const org = INDIANA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <IndianaIntakeClient orgId={org.id} stateCode={org.state_code} />
      </div>
    </div>
  );
}
