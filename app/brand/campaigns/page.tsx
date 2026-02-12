'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

type Campaign = {
  id: string;
  title: string;
  concept: string | null;
  objective: string | null;
  fixed_price: number | null;
  deadline: string | null;
  status: string | null;
  deliverables: any;
  brief_url: string | null;
  brand_id: string;
};

export default function BrandCampaignsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.brand_id) return;
    loadCampaigns();
  }, [user?.brand_id, userLoading]);

  const loadCampaigns = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('brand_id', user?.brand_id!)
      .order('created_at', { ascending: false });

    setCampaigns((data as any) || []);
    setLoading(false);
  };

  const handleDuplicate = async (campaign: Campaign, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    
    if (!confirm(`האם אתה בטוח שברצונך לשכפל את הקמפיין "${campaign.title}"?`)) {
      return;
    }

    setDuplicating(campaign.id);
    const supabase = createClient();

    try {
      // Get products for this campaign
      const { data: products } = await supabase
        .from('campaign_products')
        .select('name, sku, image_url, quantity')
        .eq('campaign_id', campaign.id);

      // Create new campaign
      const { data: newCampaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          brand_id: campaign.brand_id,
          title: `${campaign.title} (עותק)`,
          objective: campaign.objective,
          concept: campaign.concept,
          fixed_price: campaign.fixed_price,
          deadline: campaign.deadline,
          status: 'draft',
          deliverables: campaign.deliverables,
          brief_url: campaign.brief_url,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Duplicate products
      if (products && products.length > 0 && newCampaign) {
        const productsToInsert = products.map((p) => ({
          campaign_id: newCampaign.id,
          name: p.name,
          sku: p.sku,
          image_url: p.image_url,
          quantity: p.quantity,
        }));

        await supabase.from('campaign_products').insert(productsToInsert);
      }

      alert('הקמפיין שוכפל בהצלחה!');
      loadCampaigns();
      router.push(`/brand/campaigns/${newCampaign?.id}`);
    } catch (error: any) {
      alert('שגיאה בשכפול: ' + error.message);
    } finally {
      setDuplicating(null);
    }
  };

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    open: 'פתוח',
    closed: 'סגור',
    archived: 'בארכיון',
  };

  const statusColors: Record<string, string> = {
    draft: 'text-gray-400',
    open: 'text-green-400',
    closed: 'text-blue-400',
    archived: 'text-gray-500',
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#212529] mb-2">הקמפיינים שלי</h1>
            <p className="text-muted">ניהול וניטור קמפיינים</p>
          </div>
          <Link href="/brand/campaigns/new">
            <Button>קמפיין חדש +</Button>
          </Link>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="relative">
                <Link href={`/brand/campaigns/${campaign.id}`}>
                  <Card hover className="h-full">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-[#212529]">{campaign.title}</h3>
                          <span className={`text-sm ${statusColors[campaign.status || 'draft']}`}>
                            {statusLabels[campaign.status || 'draft']}
                          </span>
                        </div>
                        {campaign.concept && (
                          <p className="text-muted text-sm line-clamp-2">{campaign.concept}</p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-subtle">
                        <div className="text-gold font-bold">
                          {campaign.fixed_price
                            ? `₪${campaign.fixed_price.toLocaleString()}`
                            : 'מחיר לא הוגדר'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
                
                {/* Duplicate Button */}
                <button
                  onClick={(e) => handleDuplicate(campaign, e)}
                  disabled={duplicating === campaign.id}
                  className="absolute top-4 left-4 px-3 py-1.5 bg-surface border border-subtle text-[#212529] rounded-lg hover:bg-white/10 hover:border-gold transition-colors text-sm disabled:opacity-50"
                  title="שכפל קמפיין"
                >
                  {duplicating === campaign.id ? '⏳' : ''}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-muted mb-4">עדיין לא יצרת קמפיינים</p>
              <Link href="/brand/campaigns/new">
                <Button>צור את הקמפיין הראשון</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      <TutorialPopup tutorialKey="brand_campaigns" />
    </div>
  );
}
