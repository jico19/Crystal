import React from 'react';
import { StateHeader } from './StateHeader.tsx';
import { StateFooter } from './StateFooter.tsx';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white font-sans antialiased">
      <StateHeader />
      <main className="flex-1">
        {children}
      </main>
      <StateFooter />
    </div>
  );
};
