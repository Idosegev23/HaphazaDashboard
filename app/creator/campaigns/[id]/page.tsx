'use client';

import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [availability, setAvailability] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Load campaign
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('id, title, concept, objective, fixed_price, deadline, status, deliverables, brief_url, brands(name)')
      .eq('id', params.id as string)
      .single();

    setCampaign(campaignData);

    // Check for products in this campaign
    const { data: productsData } = await supabase
      .from('campaign_products')
      .select('*')
      .eq('campaign_id', params.id as string);

    setProducts(productsData || []);

    // Check if already applied
    const { data: appData } = await supabase
      .from('applications')
      .select('*')
      .eq('campaign_id', params.id as string)
      .eq('creator_id', user.id)
      .single();

    setApplication(appData);
    setLoading(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('applications').insert({
      campaign_id: params.id as string,
      creator_id: user.id,
      message,
      availability,
      portfolio_links: portfolioLinks,
      status: 'submitted',
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    alert('הבקשה נשלחה בהצלחה!');
    router.push('/creator/applications');
  };

  if (loading) {
    return <div className="p-8 text-[#212529]">טוען...</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-[#212529]">קמפיין לא נמצא</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← חזרה
        </Button>

        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-[#212529] mb-4">{campaign.title}</h1>
          <div className="text-[#6c757d] mb-4">{campaign.brands?.name}</div>
          
          {products.length > 0 && (
            <div className="mb-6 bg-orange-500/10 border-2 border-orange-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">📦</span>
                <div className="flex-1">
                  <h3 className="text-[#212529] font-bold mb-1">⚠️ משלוח מוצר נדרש</h3>
                  <p className="text-orange-200 text-sm mb-3">
                    קמפיין זה דורש קבלת מוצרים פיזיים מהמותג. אם תאושר/י, תצטרך/י לספק כתובת למשלוח ולהמתין לקבלת המוצרים לפני שתוכל/י להתחיל בעבודה על התוכן.
                  </p>
                  <div className="bg-[#f8f9fa] rounded-lg p-3 space-y-2">
                    <h4 className="text-[#212529] font-medium text-sm">מוצרים שיישלחו:</h4>
                    {products.map((product, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-lg">📦</div>
                        )}
                        <div className="flex-1">
                          <div className="text-[#212529] font-medium">{product.name}</div>
                          {product.sku && <div className="text-[#6c757d] text-xs">SKU: {product.sku}</div>}
                        </div>
                        {product.quantity && <div className="text-[#f2cc0d]">x{product.quantity}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {campaign.brief_url && (
            <div className="mb-6 bg-[#f2cc0d]/10 border-2 border-[#f2cc0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  <div>
                    <h3 className="text-[#212529] font-bold">בריף מפורט זמין</h3>
                    <p className="text-[#6c757d] text-sm">המותג העלה מסמך בריף מלא</p>
                  </div>
                </div>
                <a
                  href={campaign.brief_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#f2cc0d] text-black font-bold rounded-lg hover:bg-[#d4b00b] transition-colors"
                >
                  📥 הורד בריף
                </a>
              </div>
            </div>
          )}
          
          {campaign.concept && (
            <div className="mb-6">
              <h3 className="text-[#212529] font-bold mb-2">קונספט</h3>
              <p className="text-[#6c757d]">{campaign.concept}</p>
            </div>
          )}

          {campaign.deliverables && Object.keys(campaign.deliverables).length > 0 && (
            <div className="mb-6">
              <h3 className="text-[#212529] font-bold mb-3">תוצרים נדרשים</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(campaign.deliverables).map(([key, value]) => {
                  if (!value || (value as number) === 0) return null;
                  const labels: Record<string, string> = {
                    instagram_story: 'Instagram Story',
                    instagram_reel: 'Instagram Reel',
                    instagram_post: 'Instagram Post',
                    tiktok_video: 'TikTok Video',
                    ugc_video: 'UGC Video',
                    photo: 'Photo (תמונה)',
                  };
                  return (
                    <span key={key} className="px-3 py-1 bg-[#f8f9fa] border border-[#f2cc0d] rounded-full text-[#212529] text-sm">
                      {value as number} x {labels[key] || key}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#dee2e6]">
            {campaign.fixed_price && (
              <div>
                <span className="text-[#6c757d]">תשלום: </span>
                <span className="text-[#f2cc0d] font-bold">
                  ₪{campaign.fixed_price.toLocaleString()}
                </span>
              </div>
            )}
            {campaign.deadline && (
              <div>
                <span className="text-[#6c757d]">תאריך יעד: </span>
                <span className="text-[#212529]">
                  {new Date(campaign.deadline).toLocaleDateString('he-IL')}
                </span>
              </div>
            )}
          </div>
        </Card>

        {!application ? (
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-6">הגשת בקשה לקמפיין</h2>
            <form onSubmit={handleApply} className="space-y-6">
              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#212529] mb-2">
                  למה לבחור בך? *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ספרו למותג על החוזקות שלכם, הניסיון שלכם ולמה אתם מתאימים לקמפיין..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              {/* Availability */}
              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-[#212529] mb-2">
                  זמינות לביצוע
                </label>
                <select
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                >
                  <option value="">בחר זמינות</option>
                  <option value="immediate">מיידי - יכול להתחיל מיד</option>
                  <option value="within_week">תוך שבוע</option>
                  <option value="within_two_weeks">תוך שבועיים</option>
                  <option value="flexible">גמיש - לפי צורכי הקמפיין</option>
                </select>
              </div>

              {/* Portfolio Links */}
              <div>
                <label htmlFor="portfolio_links" className="block text-sm font-medium text-[#212529] mb-2">
                  קישורים לעבודות קודמות
                </label>
                <textarea
                  id="portfolio_links"
                  value={portfolioLinks}
                  onChange={(e) => setPortfolioLinks(e.target.value)}
                  placeholder="הוסיפו קישורים לעבודות UGC קודמות שלכם (סרטונים, פוסטים, וכו')"
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors resize-none"
                />
                <p className="text-xs text-[#6c757d] mt-1">
                  כל קישור בשורה חדשה (Instagram, TikTok, YouTube, וכו')
                </p>
              </div>

              <div className="pt-4 border-t border-[#dee2e6]">
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'שולח בקשה...' : 'שלח בקשה לקמפיין'}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4">הבקשה שלך</h2>
            <div className="text-[#6c757d]">
              סטטוס:{' '}
              <span className="text-[#f2cc0d]">
                {application.status === 'submitted' ? 'ממתין לאישור' : application.status}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
