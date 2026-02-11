'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

export default function OnboardingPage() {
  const [roleType, setRoleType] = useState<'creator' | 'brand' | null>(null);
  const router = useRouter();

  const handleRoleSelection = async (type: 'creator' | 'brand') => {
    setRoleType(type);
    
    if (type === 'creator') {
      router.push('/onboarding/creator');
    } else {
      router.push('/onboarding/brand');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#121212] to-[#232010] p-4">
      <div className="glass-panel w-full max-w-2xl p-8 rounded-xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#f2cc0d] mb-4">ברוכים הבאים ל-LEADERS</h1>
          <p className="text-[#cbc190] text-lg">בחרו את סוג החשבון שלכם</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleRoleSelection('creator')}
            className="glass-panel-hover p-8 rounded-xl text-center transition-all"
          >
            <div className="text-5xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-white mb-3">יוצר תוכן</h2>
            <p className="text-[#cbc190]">
              אני יוצר/ת תוכן UGC ורוצה לעבוד עם מותגים
            </p>
          </button>

          <button
            onClick={() => handleRoleSelection('brand')}
            className="glass-panel-hover p-8 rounded-xl text-center transition-all"
          >
            <div className="text-5xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-white mb-3">מותג</h2>
            <p className="text-[#cbc190]">
              אני מייצג/ת מותג ומעוניין/נת לעבוד עם יוצרי תוכן
            </p>
          </button>
        </div>
      </div>

      <TutorialPopup tutorialKey="welcome" />
    </div>
  );
}
