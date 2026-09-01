import type { Metadata } from 'next';
import './globals.css';
import { INDIANA_ORGANIZATION } from '../lib/organization';
import { Navbar, Footer } from '@crystal/ui';

export const metadata: Metadata = {
  title: 'Cherish Open Arms | Licensed Home Care Services in Indiana',
  description:
    'Licensed attendant care, companion support, and structured family caregiving for Indianapolis and Indiana families. FSSA License: IN-FSSA-982104.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{
      '--primary': INDIANA_ORGANIZATION.branding_theme.primary_color,
      '--secondary': INDIANA_ORGANIZATION.branding_theme.secondary_color,
      '--accent': INDIANA_ORGANIZATION.branding_theme.accent_color,
    } as React.CSSProperties}>
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar organization={INDIANA_ORGANIZATION} />
        <main className="flex-grow">{children}</main>
        <Footer organization={INDIANA_ORGANIZATION} />
      </body>
    </html>
  );
}
