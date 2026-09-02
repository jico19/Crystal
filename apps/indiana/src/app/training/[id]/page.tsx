import { Metadata } from 'next';
import { IndianaLessonClient } from './IndianaLessonClient';

export const metadata: Metadata = {
  title: 'Training Lesson & Knowledge Check | Cherish Open Arms Indiana',
  description: 'Watch video module, complete anti-skip lesson, and pass end-of-module quiz.',
};

export default function IndianaLessonPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <IndianaLessonClient moduleId={params.id} />
      </div>
    </div>
  );
}
