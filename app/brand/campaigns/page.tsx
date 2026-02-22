'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

const STATUS_CONFIG: Record<string, { label: string; dotColor: string }> = {
  draft: { label: 'טיוטה', dotColor: '#f59e0b' },
  open: { label: 'פתוח', dotColor: '#22c55e' },
  closed: { label: 'כבוי', dotColor: '#ef4444' },
  archived: { label: 'הסתיים', dotColor: '#6b7281' },
};

export default function BrandCampaignsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  // A2: Filter state from URL params
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.brand_id) return;
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // A2: Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (searchQuery) params.set('q', searchQuery);
    const paramStr = params.toString();
    const newUrl = paramStr ? `?${paramStr}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [statusFilter, searchQuery]);

  // A2: Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter !== 'all' && (c.status || 'draft') !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(c.title?.toLowerCase().includes(q) || c.concept?.toLowerCase().includes(q) || c.objective?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const handleDuplicate = async (campaign: Campaign, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`האם אתה בטוח שברצונך לשכפל את הקמפיין "${campaign.title}"?`)) {
      return;
    }

    setDuplicating(campaign.id);
    const supabase = createClient();

    try {
      const { data: products } = await supabase
        .from('campaign_products')
        .select('name, sku, image_url, quantity')
        .eq('campaign_id', campaign.id);

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

  const initial = (user?.profile?.display_name || '?').charAt(0).toUpperCase();

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#f2cc0d] border-t-transparent rounded-full animate-spin" />
          <div className="text-[#6b7281] text-lg">טוען קמפיינים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f4f5f7] px-[19px] py-4 lg:px-10 lg:py-6">
      <div className="max-w-[1152px] mx-auto space-y-5">

        {/* Blue Hero Banner */}
        <div className="bg-[#dbe4f5] rounded-2xl px-5 py-6 lg:px-8 flex items-center gap-4 relative overflow-hidden min-h-[228px] lg:min-h-[138px]">
          {/* Avatar */}
          <div className="w-[58px] h-[58px] rounded-full bg-[#8e33f5] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[31px] font-normal">{initial}</span>
          </div>

          {/* Title + subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[36px] font-medium text-black leading-[32px]">הקמפיינים שלי</h1>
            <p className="text-[#666] text-lg lg:text-base mt-2 lg:mt-1 leading-[12px]">ניהול וניטור קמפיינים</p>
          </div>

          {/* New campaign button */}
          <Link
            href="/brand/campaigns/new"
            className="hidden lg:flex items-center gap-2 bg-[#e5f2d6] rounded-full px-[17px] py-3 text-black font-semibold text-base hover:brightness-95 transition-all flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            קמפיין חדש
          </Link>
        </div>

        {/* Mobile new campaign button */}
        <Link
          href="/brand/campaigns/new"
          className="flex lg:hidden items-center justify-center gap-2 bg-[#e5f2d6] rounded-full px-[17px] h-[46px] text-black font-semibold text-lg hover:brightness-95 transition-all w-full"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          קמפיין חדש
        </Link>

        {/* A2: Filters */}
        {campaigns.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם קמפיין..."
              className="flex-1 min-w-[200px] px-4 py-2 bg-white border border-[#dfdfdf] rounded-xl text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d] transition-colors"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-[#dfdfdf] rounded-xl text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
            >
              <option value="all">כל הסטטוסים ({campaigns.length})</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label} ({campaigns.filter(c => (c.status || 'draft') === key).length})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campaign Cards Grid */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((campaign) => {
              const status = STATUS_CONFIG[campaign.status || 'draft'] || STATUS_CONFIG.draft;
              return (
                <div key={campaign.id} className="relative group">
                  <Link href={`/brand/campaigns/${campaign.id}`}>
                    <div className="bg-white rounded-2xl px-[17px] py-4 flex flex-col gap-[10px] hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden h-[175px] lg:h-auto">
                      {/* Status badge */}
                      <div className="flex justify-end">
                        <span className="inline-flex items-center gap-1 bg-white border border-[#dfdfdf] rounded-[20px] px-2 py-[3px]">
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: status.dotColor }}
                          />
                          <span className="text-[#6b7281] text-base">{status.label}</span>
                        </span>
                      </div>

                      {/* Title + subtitle */}
                      <div className="text-right space-y-[3px] pb-[26px]">
                        <h3 className="text-[22px] font-bold text-black leading-[32px]">{campaign.title}</h3>
                        {campaign.concept && (
                          <p className="text-[#666] text-lg lg:text-base leading-[12px] line-clamp-1">{campaign.concept}</p>
                        )}
                        {!campaign.concept && campaign.objective && (
                          <p className="text-[#666] text-lg lg:text-base leading-[12px] line-clamp-1">{campaign.objective}</p>
                        )}
                        {!campaign.concept && !campaign.objective && (
                          <p className="text-[#666] text-lg lg:text-base leading-[12px]">ניהול וניטור קמפיינים</p>
                        )}
                      </div>

                      {/* Price divider */}
                      <div className="border-t border-[#dfdfdf] pt-2">
                        <p className="text-right font-bold text-lg lg:text-base text-[#020202] leading-[27px]">
                          {campaign.fixed_price
                            ? `₪ ${campaign.fixed_price.toLocaleString()}`
                            : 'מחיר לא הוגדר'}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Duplicate button - appears on hover */}
                  <button
                    onClick={(e) => handleDuplicate(campaign, e)}
                    disabled={duplicating === campaign.id}
                    className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-[#f4f5f7] border border-[#dfdfdf] flex items-center justify-center hover:bg-[#e9ecef] transition-all disabled:opacity-50"
                    title="שכפל קמפיין"
                  >
                    {duplicating === campaign.id ? (
                      <div className="w-4 h-4 border-2 border-[#6b7281] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7281" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f4f5f7] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#dfdfdf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-[#6b7281] text-lg mb-2">עדיין לא יצרת קמפיינים</p>
            <p className="text-[#adb5bd] text-sm mb-6">צור את הקמפיין הראשון שלך כדי להתחיל</p>
            <Link
              href="/brand/campaigns/new"
              className="inline-flex items-center gap-2 bg-[#e5f2d6] rounded-full px-6 py-3 text-black font-semibold text-base hover:brightness-95 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              צור קמפיין חדש
            </Link>
          </div>
        )}
      </div>

      <TutorialPopup
        tutorialKey="brand_campaigns"
        buttonClassName="bg-[#ef767a] text-white hover:brightness-90"
      />
    </div>
  );
}
