import { Metadata } from 'next';
import { GeorgiaLessonClient } from './GeorgiaLessonClient';

export const metadata: Metadata = {
  title: 'Training Lesson & Knowledge Check | With Open Hands Georgia',
  description: 'Watch video module, complete anti-skip lesson, and pass end-of-module quiz.',
};

export default function GeorgiaLessonPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <GeorgiaLessonClient moduleId={params.id} />
      </div>
    </div>
  );
}
