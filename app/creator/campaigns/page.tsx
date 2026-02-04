'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Campaign = {
  id: string;
  title: string;
  concept: string | null;
  fixed_price: number | null;
  currency: string | null;
  deadline: string | null;
  brands: {
    name: string;
  } | null;
};

type Application = {
  campaign_id: string;
  status: string | null;
};

export default function CreatorCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
    
    // Setup realtime subscription for applications
    const supabase = createClient();
    const channel = supabase
      .channel('creator-campaigns-applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Get open campaigns
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('id, title, concept, fixed_price, currency, deadline, brands(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Get my applications
    const { data: myApplications } = await supabase
      .from('applications')
      .select('campaign_id, status')
      .eq('creator_id', user.id);

    setCampaigns(campaignsData as Campaign[] || []);
    setApplications(myApplications as Application[] || []);
    setLoading(false);
  };

  const applicationMap = new Map(
    applications?.map((app) => [app.campaign_id, app.status]) || []
  );

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">קמפיינים פתוחים</h1>
              <p className="text-[#cbc190]">בחרו קמפיינים להגיש בקשה</p>
            </div>
            <Link href="/creator/applications">
              <button className="px-6 py-3 bg-[#2e2a1b] text-white font-bold rounded-lg hover:bg-[#3a3525] transition-colors border border-[#494222]">
                הבקשות שלי →
              </button>
            </Link>
          </div>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const appStatus = applicationMap.get(campaign.id);
              
              return (
                <Link key={campaign.id} href={`/creator/campaigns/${campaign.id}`}>
                  <Card hover className="h-full">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{campaign.title}</h3>
                        <p className="text-sm text-[#cbc190]">{campaign.brands?.name}</p>
                      </div>

                      {campaign.concept && (
                        <p className="text-[#cbc190] text-sm line-clamp-3">{campaign.concept}</p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-[#494222]">
                        <div className="text-[#f2cc0d] font-bold">
                          {campaign.fixed_price
                            ? `₪${campaign.fixed_price.toLocaleString()}`
                            : 'מחיר לא הוגדר'}
                        </div>
                      </div>
                      {appStatus && (
                        <div className="mt-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[appStatus]}`}>
                            {statusLabels[appStatus]}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <p className="text-[#cbc190] text-center py-8">אין קמפיינים פתוחים כרגע</p>
          </Card>
        )}
      </div>
    </div>
  );
}
