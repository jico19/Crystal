import { GEORGIA_ORGANIZATION } from '../../lib/organization';
import { Metadata } from 'next';
import { GeorgiaIntakeClient } from './GeorgiaIntakeClient';

export const metadata: Metadata = {
  title: 'Client Intake & Care Admission | With Open Hands Georgia',
  description:
    'Begin in-home personal care or companion services with With Open Hands. Complete our digital admission packet.',
};

export default function GeorgiaIntakePage() {
  const org = GEORGIA_ORGANIZATION;
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <GeorgiaIntakeClient orgId={org.id} stateCode={org.state_code} />
      </div>
    </div>
  );
}
