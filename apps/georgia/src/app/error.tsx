'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Georgia App Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-600">
          An unexpected error occurred while loading this page.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-teal-700 text-white font-medium hover:bg-teal-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
