import type { Metadata } from 'next';
import './globals.css';
import { GEORGIA_ORGANIZATION } from '../lib/organization';
import { Navbar, Footer } from '@crystal/ui';

export const metadata: Metadata = {
  title: 'With Open Hands | Licensed Home Care Services in Georgia',
  description:
    'State-licensed personal care, companion support, and skilled nursing services for Atlanta and Georgia families. DCH License: GA-HCPR-049281.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{
      '--primary': GEORGIA_ORGANIZATION.branding_theme.primary_color,
      '--secondary': GEORGIA_ORGANIZATION.branding_theme.secondary_color,
      '--accent': GEORGIA_ORGANIZATION.branding_theme.accent_color,
    } as React.CSSProperties}>
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar organization={GEORGIA_ORGANIZATION} />
        <main className="flex-grow">{children}</main>
        <Footer organization={GEORGIA_ORGANIZATION} />
      </body>
    </html>
  );
}
