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
      .select('id, title, concept, objective, fixed_price, deadline, status, deliverables, brands(name)')
      .eq('id', params.id as string)
      .single();

    setCampaign(campaignData);

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
    return <div className="p-8 text-white">טוען...</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-white">קמפיין לא נמצא</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← חזרה
        </Button>

        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">{campaign.title}</h1>
          <div className="text-[#cbc190] mb-4">{campaign.brands?.name}</div>
          
          {campaign.concept && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-2">קונספט</h3>
              <p className="text-[#cbc190]">{campaign.concept}</p>
            </div>
          )}

          {campaign.deliverables && Object.keys(campaign.deliverables).length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold mb-3">תוצרים נדרשים</h3>
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
                    <span key={key} className="px-3 py-1 bg-[#2e2a1b] border border-[#f2cc0d] rounded-full text-white text-sm">
                      {value as number} x {labels[key] || key}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#494222]">
            {campaign.fixed_price && (
              <div>
                <span className="text-[#cbc190]">תשלום: </span>
                <span className="text-[#f2cc0d] font-bold">
                  ₪{campaign.fixed_price.toLocaleString()}
                </span>
              </div>
            )}
            {campaign.deadline && (
              <div>
                <span className="text-[#cbc190]">תאריך יעד: </span>
                <span className="text-white">
                  {new Date(campaign.deadline).toLocaleDateString('he-IL')}
                </span>
              </div>
            )}
          </div>
        </Card>

        {!application ? (
          <Card>
            <h2 className="text-xl font-bold text-white mb-6">הגשת בקשה לקמפיין</h2>
            <form onSubmit={handleApply} className="space-y-6">
              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  למה לבחור בך? *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ספרו למותג על החוזקות שלכם, הניסיון שלכם ולמה אתם מתאימים לקמפיין..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors resize-none"
                />
              </div>

              {/* Availability */}
              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-white mb-2">
                  זמינות לביצוע
                </label>
                <select
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
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
                <label htmlFor="portfolio_links" className="block text-sm font-medium text-white mb-2">
                  קישורים לעבודות קודמות
                </label>
                <textarea
                  id="portfolio_links"
                  value={portfolioLinks}
                  onChange={(e) => setPortfolioLinks(e.target.value)}
                  placeholder="הוסיפו קישורים לעבודות UGC קודמות שלכם (סרטונים, פוסטים, וכו')"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors resize-none"
                />
                <p className="text-xs text-[#cbc190] mt-1">
                  כל קישור בשורה חדשה (Instagram, TikTok, YouTube, וכו')
                </p>
              </div>

              <div className="pt-4 border-t border-[#494222]">
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'שולח בקשה...' : 'שלח בקשה לקמפיין'}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">הבקשה שלך</h2>
            <div className="text-[#cbc190]">
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
