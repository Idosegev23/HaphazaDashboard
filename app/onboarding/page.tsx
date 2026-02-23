'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Only creator onboarding available — brands are created by admin
    router.push('/onboarding/creator');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#f8f9fa] p-4">
      <div className="glass-panel w-full max-w-2xl p-8 rounded-xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#f2cc0d] mb-4">ברוכים הבאים ל-LEADERS</h1>
          <p className="text-[#6c757d] text-lg">מעביר אותך להשלמת הפרופיל...</p>
        </div>
      </div>

      <TutorialPopup tutorialKey="welcome" />
    </div>
  );
}
