'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip guard on the pending-approval page itself
    if (pathname === '/creator/pending-approval') {
      setChecked(true);
      return;
    }

    const checkCreatorStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setChecked(true);
        return;
      }

      const { data: creator } = await supabase
        .from('creators')
        .select('status')
        .eq('user_id', user.id)
        .single();

      const status = creator?.status;

      if (status && status !== 'approved') {
        router.replace('/creator/pending-approval');
        return;
      }

      setChecked(true);
    };

    checkCreatorStatus();
  }, [pathname, router]);

  if (!checked && pathname !== '/creator/pending-approval') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  return <>{children}</>;
}
