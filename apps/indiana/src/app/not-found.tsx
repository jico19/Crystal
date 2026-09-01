import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-gray-900">404 - Page Not Found</h2>
        <p className="text-gray-600">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-800 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
