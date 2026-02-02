'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatorOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since onboarding is now part of registration
    router.push('/creator/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#232010]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f2cc0d] mx-auto mb-4"></div>
        <p className="text-[#cbc190]">מעביר אותך לדשבורד...</p>
      </div>
    </div>
  );
}
