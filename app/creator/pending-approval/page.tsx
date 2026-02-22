'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('pending_approval');
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: creator } = await supabase
      .from('creators')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const creatorStatus = creator?.status || 'pending_approval';
    setStatus(creatorStatus);

    if (creatorStatus === 'approved') {
      router.push('/creator/dashboard');
    } else if (creatorStatus === 'rejected') {
      // Fetch rejection reason from notification
      const { data: notification } = await supabase
        .from('notifications')
        .select('body')
        .eq('user_id', user.id)
        .eq('type', 'creator_rejected')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (notification) {
        setReason(notification.body);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center space-y-4">
            {status === 'pending_approval' && (
              <>
                <div className="text-6xl mb-4">⏳</div>
                <h1 className="text-2xl font-bold text-[#212529]">ממתין לאישור</h1>
                <p className="text-[#6c757d]">
                  החשבון שלך נמצא בבדיקה. צוות Leaders יבדוק את הפרופיל שלך ויאשר אותו בהקדם.
                </p>
                <div className="bg-[#f2cc0d]/10 border border-[#f2cc0d]/30 rounded-lg p-4">
                  <p className="text-sm text-[#212529]">
                    בדרך כלל תהליך האישור לוקח עד 24 שעות. הדף מתעדכן אוטומטית.
                  </p>
                </div>
              </>
            )}

            {status === 'rejected' && (
              <>
                <div className="text-6xl mb-4">😔</div>
                <h1 className="text-2xl font-bold text-[#212529]">הבקשה נדחתה</h1>
                <p className="text-[#6c757d]">
                  לצערנו, הבקשה שלך להצטרף כמשפיען/ית לא אושרה.
                </p>
                {reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 text-right">
                    {reason}
                  </div>
                )}
                <p className="text-[#6c757d] text-sm">
                  ניתן ליצור קשר עם התמיכה בכתובת support@leaders.co.il
                </p>
              </>
            )}

            {status === 'suspended' && (
              <>
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-[#212529]">חשבון מושעה</h1>
                <p className="text-[#6c757d]">
                  החשבון שלך הושעה. ניתן ליצור קשר עם התמיכה למידע נוסף.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
