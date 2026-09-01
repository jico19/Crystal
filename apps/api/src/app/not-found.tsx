import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 text-white">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold">404 - Endpoint / Page Not Found</h2>
        <p className="text-slate-400">The requested resource does not exist on this API server.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Return to API Hub
        </Link>
      </div>
    </div>
  );
}
