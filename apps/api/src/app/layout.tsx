import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Crystal Multi-State Platform | Unified API & Admin Portal',
  description: 'Centralized administration & API modular monolith for Georgia and Indiana operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}
