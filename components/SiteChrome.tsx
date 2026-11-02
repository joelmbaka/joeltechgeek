'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { NavigationLoader } from './NavigationLoader';
import { Footer } from './Footer';

export function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === '/crm' || path.startsWith('/crm/')) {
    return <div className="min-h-screen">{children}</div>;
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <NavigationLoader />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
