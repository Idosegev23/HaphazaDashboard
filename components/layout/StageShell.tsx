'use client';

import { ReactNode } from 'react';
import { useUser } from '@/hooks/use-user';
import { usePathname } from 'next/navigation';
import { TopNav } from './TopNav';

interface StageShellProps {
  children: ReactNode;
}

/**
 * Main application shell with top navigation
 * Dark-first design with RTL support
 */
export function StageShell({ children }: StageShellProps) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  // Hide navigation on auth/onboarding pages
  const hideNav = pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#f2cc0d] text-xl">Loading...</div>
      </div>
    );
  }

  if (hideNav) {
    return <div className="min-h-screen bg-[#121212]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col" dir={user?.profile?.language === 'he' ? 'rtl' : 'ltr'}>
      <TopNav user={user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
