'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Import tab components
import { OverviewTab } from '@/components/brand/tabs/OverviewTab';
import { ApplicationsTab } from '@/components/brand/tabs/ApplicationsTab';
import { ShipmentsTab } from '@/components/brand/tabs/ShipmentsTab';
import { ContentTab } from '@/components/brand/tabs/ContentTab';
import { PaymentsTab } from '@/components/brand/tabs/PaymentsTab';

type Campaign = {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  fixed_price: number | null;
  brands: {
    name: string;
  } | null;
};

const TABS = [
  { id: 'overview', label: '📋 סקירה', icon: '📋' },
  { id: 'applications', label: '👥 משפיענים', icon: '👥' },
  { id: 'shipments', label: '📦 משלוחים', icon: '📦' },
  { id: 'content', label: '📤 תכנים', icon: '📤' },
  { id: 'payments', label: '💰 תשלומים', icon: '💰' },
];

export default function CampaignManagePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, status, deadline, fixed_price, brands(name)')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error loading campaign:', error);
      alert('שגיאה בטעינת הקמפיין');
      router.push('/brand/campaigns');
      return;
    }

    setCampaign(data as Campaign);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">קמפיין לא נמצא</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    published: 'פורסם',
    active: 'פעיל',
    completed: 'הושלם',
    archived: 'בארכיון',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    published: 'bg-blue-500',
    active: 'bg-green-500',
    completed: 'bg-purple-500',
    archived: 'bg-gray-600',
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Header */}
      <div className="bg-[#1E1E1E] border-b border-[#494222] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/brand/campaigns')}
                className="text-[#cbc190] hover:text-[#f2cc0d]"
              >
                ← חזרה לקמפיינים
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{campaign.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                      statusColors[campaign.status || 'draft']
                    }`}
                  >
                    {statusLabels[campaign.status || 'draft']}
                  </span>
                  {campaign.brands && (
                    <span className="text-[#cbc190] text-sm">
                      {campaign.brands.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/brand/campaigns/${campaignId}`)}
              className="bg-[#2e2a1b] text-white hover:bg-[#3a3525]"
            >
              ⚙️ עריכת פרטים
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#f2cc0d] text-black'
                    : 'bg-[#2e2a1b] text-white hover:bg-[#3a3525]'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab campaignId={campaignId} campaign={campaign} />}
        {activeTab === 'applications' && <ApplicationsTab campaignId={campaignId} />}
        {activeTab === 'shipments' && <ShipmentsTab campaignId={campaignId} />}
        {activeTab === 'content' && <ContentTab campaignId={campaignId} />}
        {activeTab === 'payments' && <PaymentsTab campaignId={campaignId} />}
      </div>
    </div>
  );
}
