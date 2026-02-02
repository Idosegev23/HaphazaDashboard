'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Application = {
  id: string;
  message: string | null;
  status: string | null;
  created_at: string | null;
  campaigns: {
    id: string;
    title: string;
    brands: {
      name: string;
    } | null;
  } | null;
};

export default function CreatorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadApplications();
    
    // Setup realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel('creator-applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        () => {
          loadApplications();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadApplications = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Get my applications
    const { data } = await supabase
      .from('applications')
      .select(`
        id,
        message,
        status,
        created_at,
        campaigns(id, title, brands(name))
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    setApplications(data as Application[] || []);
    setLoading(false);
  };

  const statusLabels: Record<string, string> = {
    submitted: 'ממתין לאישור',
    approved: 'אושר! 🎉',
    rejected: 'נדחה',
  };

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  const statusDescriptions: Record<string, string> = {
    submitted: 'הבקשה שלך נמצאת בבדיקה',
    approved: 'הבקשה שלך אושרה! צפה במשימות שלך',
    rejected: 'הבקשה שלך נדחתה. ניתן לנסות קמפיינים אחרים',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">הבקשות שלי</h1>
          <p className="text-[#cbc190]">מעקב אחר כל הבקשות שהגשת לקמפיינים</p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} hover className="relative">
                <div className={`status-stripe ${statusColors[application.status || 'submitted']}`} />
                <div className="pl-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">
                          {application.campaigns?.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[application.status || 'submitted']}`}>
                          {statusLabels[application.status || 'submitted']}
                        </span>
                      </div>
                      <div className="text-sm text-[#cbc190] mb-2">
                        מותג: {application.campaigns?.brands?.name}
                      </div>
                      <p className="text-[#cbc190] text-sm mb-3">
                        {statusDescriptions[application.status || 'submitted']}
                      </p>
                      {application.message && (
                        <p className="text-[#cbc190] text-sm line-clamp-2 italic">
                          "{application.message}"
                        </p>
                      )}
                      <div className="text-xs text-[#cbc190] mt-3">
                        נשלח ב: {new Date(application.created_at || '').toLocaleDateString('he-IL')} {new Date(application.created_at || '').toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      {application.status === 'approved' && (
                        <Link href="/creator/tasks">
                          <button className="px-4 py-2 bg-[#f2cc0d] text-black font-bold rounded-lg hover:bg-[#d4b00b] transition-colors">
                            למשימות →
                          </button>
                        </Link>
                      )}
                      {application.status === 'rejected' && (
                        <Link href="/creator/campaigns">
                          <button className="px-4 py-2 bg-[#2e2a1b] text-white font-bold rounded-lg hover:bg-[#3a3525] transition-colors">
                            לקמפיינים
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-[#cbc190] text-lg mb-4">עדיין לא הגשת בקשות לקמפיינים</p>
              <Link href="/creator/campaigns">
                <button className="px-6 py-3 bg-[#f2cc0d] text-black font-bold rounded-lg hover:bg-[#d4b00b] transition-colors">
                  עבור לקמפיינים פתוחים →
                </button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
