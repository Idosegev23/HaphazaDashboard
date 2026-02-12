'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TierBadge, TierLevel } from '@/components/ui/TierBadge';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

type Application = {
  id: string;
  message: string;
  status: string;
  created_at: string;
  availability: string | null;
  portfolio_links: string | null;
  creator_id?: string;
  campaigns: {
    title: string;
    fixed_price: number | null;
  } | null;
  creators: {
    niches: string[] | null;
    age: number | null;
    gender: string | null;
    country: string | null;
    platforms: any | null;
    bio: string | null;
    users_profiles: {
      display_name: string;
      email: string;
      language: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
};

type PortfolioItem = {
  id: string;
  title: string;
  media_url: string;
  media_type: string;
  platform: string | null;
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonCode, setRejectReasonCode] = useState<string>('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<string>(''); // For custom pricing
  const [showCustomPriceInput, setShowCustomPriceInput] = useState(false);

  const rejectionReasons = [
    { value: 'not_relevant', label: 'לא רלוונטי לקמפיין' },
    { value: 'low_quality_profile', label: 'פרופיל באיכות נמוכה' },
    { value: 'insufficient_followers', label: 'מספר עוקבים לא מספיק' },
    { value: 'wrong_niche', label: 'נישה לא מתאימה' },
    { value: 'timing_issue', label: 'בעיית תזמון' },
    { value: 'budget_mismatch', label: 'אי התאמה בתקציב' },
    { value: 'other', label: 'אחר' },
  ];
  const router = useRouter();

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadPortfolio = async (creatorId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('portfolio_items')
      .select('id, title, media_url, media_type, platform')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (data) {
      setPortfolio(data);
    }
  };

  const loadMetrics = async (creatorId: string) => {
    const supabase = createClient();
    
    // Get metrics
    const { data: metricsData } = await supabase
      .from('creator_metrics')
      .select('*')
      .eq('creator_id', creatorId)
      .single();
    
    // Get tier
    const { data: creatorData } = await supabase
      .from('creators')
      .select('tier')
      .eq('user_id', creatorId)
      .single();
    
    if (metricsData) {
      setMetrics(metricsData);
    }
    if (creatorData) {
      setTier(creatorData.tier);
    }
  };

  const loadApplication = async () => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        message,
        status,
        created_at,
        creator_id,
        availability,
        portfolio_links,
        campaigns(title, fixed_price)
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error loading application:', error);
      setLoading(false);
      return;
    }

    // Get creator profile separately (optimized to avoid 431)
    if (data && (data as any).creator_id) {
      const { data: profileData } = await supabase
        .from('users_profiles')
        .select('display_name, email, language, avatar_url')
        .eq('user_id', (data as any).creator_id)
        .single();
      
      const { data: creatorData } = await supabase
        .from('creators')
        .select('niches, age, gender, country, platforms, bio')
        .eq('user_id', (data as any).creator_id)
        .single();
      
      if (profileData && creatorData) {
        (data as any).creators = Object.assign({}, creatorData, {
          users_profiles: profileData
        });
      }
    }

    setApplication(data as any);
    
    // Load portfolio and metrics if creator exists
    if ((data as any).creator_id) {
      loadPortfolio((data as any).creator_id);
      loadMetrics((data as any).creator_id);
    }
    
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!application) return;
    
    // Determine the payment amount to use
    const campaignPrice = application.campaigns?.fixed_price;
    let finalPrice = campaignPrice;
    
    // If there's no fixed price or custom price is set, validate custom price
    if (!campaignPrice || customPrice.trim()) {
      const customAmount = parseFloat(customPrice);
      if (!customPrice.trim() || isNaN(customAmount) || customAmount <= 0) {
        alert('יש להזין מחיר תקף למשפיען');
        return;
      }
      finalPrice = customAmount;
    }
    
    // הודעת אזהרה שונה אם משנים החלטה קיימת
    const isChangingDecision = application.status === 'rejected';
    const confirmMessage = isChangingDecision
      ? `האם אתה בטוח שברצונך לשנות את ההחלטה ולאשר את הבקשה?\n\nתשלום למשפיען: ₪${finalPrice}\n\nשים לב: אם כבר נדחית הבקשה, זה ישנה את ההחלטה ויצור משימה למשפיען.`
      : `האם אתה בטוח שברצונך לאשר את הבקשה?\n\nתשלום למשפיען: ₪${finalPrice}\n\nזה ייצור משימה אוטומטית עבור המשפיען.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    // Get application details with campaign info
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('campaign_id, creator_id, campaigns(title, deadline, fixed_price)')
      .eq('id', applicationId)
      .single();

    if (appError || !appData) {
      alert('שגיאה בטעינת פרטי הבקשה: ' + (appError?.message || 'לא נמצא'));
      setProcessing(false);
      return;
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      alert('שגיאה באישור: ' + updateError.message);
      setProcessing(false);
      return;
    }

    // Check if campaign has products (requires shipment)
    const { count: productsCount } = await supabase
      .from('campaign_products')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', appData.campaign_id);
    
    const requiresProduct = (productsCount || 0) > 0;
    
    // Create task automatically
    const taskTitle = `משימה לקמפיין ${appData.campaigns?.title || 'ללא שם'}`;
    
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        campaign_id: appData.campaign_id,
        creator_id: appData.creator_id,
        title: taskTitle,
        status: 'selected',
        due_at: appData.campaigns?.deadline || null,
        requires_product: requiresProduct,
        payment_amount: finalPrice,
      })
      .select('id')
      .single();

    if (taskError) {
      alert('הבקשה אושרה אבל היתה שגיאה ביצירת המשימה: ' + taskError.message);
      setProcessing(false);
      return;
    }

    // If campaign has products, create shipment request automatically
    if (requiresProduct && taskData) {
      const { error: shipmentError } = await supabase
        .from('shipment_requests')
        .insert({
          campaign_id: appData.campaign_id,
          creator_id: appData.creator_id,
          status: 'waiting_address',
        });

      if (shipmentError) {
        console.error('Error creating shipment request:', shipmentError);
        alert('המשימה נוצרה אבל היתה שגיאה ביצירת בקשת משלוח: ' + shipmentError.message);
      } else {
        console.log(`✓ בקשת משלוח נוצרה אוטומטית - הקמפיין כולל ${productsCount} מוצרים`);
      }
    }

    // Show success message
    // Audit log
    await supabase.rpc('log_audit', {
      p_entity: 'application',
      p_entity_id: applicationId,
      p_action: 'approved',
      p_metadata: {
        task_id: taskData.id,
        payment_amount: finalPrice,
        custom_price_used: !!customPrice.trim()
      }
    });

    alert(` הבקשה אושרה בהצלחה!\n\nמשימה נוצרה אוטומטית עבור המשפיען.\nתשלום: ₪${finalPrice}\n\nהמשפיען יראה את המשימה במערכת שלו.`);
    
    // Reload the current page to show updated status
    loadApplication();
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!application) return;
    
    // בדיקה אם יש פידבק קיים
    const supabase = createClient();
    const { data: existingFeedback } = await supabase
      .from('application_feedback')
      .select('id')
      .eq('application_id', applicationId)
      .eq('decision', 'reject')
      .single();

    const hasExistingFeedback = !!existingFeedback;
    
    // אם אין פידבק קיים, חובה למלא
    if (!hasExistingFeedback) {
      if (!rejectReasonCode) {
        alert('יש לבחור סיבת דחייה');
        return;
      }
      if (!rejectReason.trim() || rejectReason.length < 10) {
        alert('יש להזין הסבר מפורט (לפחות 10 תווים)');
        return;
      }
    }

    const confirmMessage = application.status === 'approved'
      ? 'האם אתה בטוח שברצונך לשנות את ההחלטה ולדחות את הבקשה?\n\nשים לב: המשימה שנוצרה תיוותר, אבל הסטטוס ישתנה לנדחה.'
      : 'האם אתה בטוח שברצונך לדחות את הבקשה?';

    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessing(true);

    try {
      // רק אם אין פידבק קיים, יוצרים חדש
      if (!hasExistingFeedback && rejectReasonCode && rejectReason) {
        const { error: feedbackError } = await supabase
          .from('application_feedback')
          .insert({
            application_id: applicationId,
            decision: 'reject',
            reason_code: rejectReasonCode as 'not_relevant' | 'low_quality_profile' | 'insufficient_followers' | 'wrong_niche' | 'timing_issue' | 'budget_mismatch' | 'other',
            note: rejectReason,
          });

        if (feedbackError) throw feedbackError;
      }

      // רק אחרי שהפידבק נוצר, מעדכנים את הסטטוס
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Audit log
      await supabase.rpc('log_audit', {
        p_entity: 'application',
        p_entity_id: applicationId,
        p_action: 'rejected',
        p_metadata: { reason_code: rejectReasonCode }
      });

      alert('הבקשה נדחתה והמשפיען קיבל פידבק');
      router.push('/brand/applications');
    } catch (error: any) {
      alert('שגיאה בדחייה: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">בקשה לא נמצאה</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    submitted: 'ממתין לאישור',
    approved: 'אושר',
    rejected: 'נדחה',
  };

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/brand/applications')}
                className="text-[#6c757d] hover:text-[#f2cc0d] transition-colors"
              >
                ← חזרה
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#212529]">בקשת משפיען</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-[#212529] ${statusColors[application.status]}`}>
                {statusLabels[application.status]}
              </span>
              {application.campaigns && (
                <span className="text-[#6c757d] text-sm">
                  {application.campaigns.title}
                </span>
              )}
            </div>
          </div>
          {application.status === 'submitted' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={processing}
                className="bg-red-600 hover:bg-red-700"
              >
                דחה
              </Button>
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                אשר
              </Button>
            </div>
          )}
          {application.status === 'approved' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={processing}
                className="bg-orange-600 hover:bg-orange-700"
              >
                שנה להחלטה: דחה
              </Button>
            </div>
          )}
          {application.status === 'rejected' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                שנה החלטה: אשר
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Creator Info */}
          <Card>
            <div className="flex items-start gap-6 mb-6 pb-6 border-b border-[#dee2e6]">
              {/* Large Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-[#f8f9fa] border-4 border-[#f2cc0d]">
                  {application.creators?.users_profiles?.avatar_url ? (
                    <img 
                      src={application.creators.users_profiles.avatar_url} 
                      alt={application.creators.users_profiles.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-[#f2cc0d]">
                      
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#212529] mb-2">
                  {application.creators?.users_profiles?.display_name || 'משפיען'}
                </h2>
                {application.creators?.users_profiles?.email && (
                  <a 
                    href={`mailto:${application.creators.users_profiles.email}`} 
                    className="text-[#6c757d] hover:text-[#f2cc0d] transition-colors text-sm block mb-3"
                  >
                     {application.creators.users_profiles.email}
                  </a>
                )}
                
                {/* Social Links - Prominent */}
                {application.creators?.platforms && typeof application.creators.platforms === 'object' && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(application.creators.platforms as Record<string, any>).map(([platform, data]: [string, any]) => {
                      const link = 
                        platform === 'instagram' ? `https://instagram.com/${data?.username}` :
                        platform === 'tiktok' ? `https://tiktok.com/@${data?.username}` :
                        platform === 'youtube' ? `https://youtube.com/@${data?.username}` :
                        platform === 'facebook' ? `https://facebook.com/${data?.username}` :
                        data?.url || '#';
                      
                      const icon = 
                        platform === 'instagram' ? '' :
                        platform === 'tiktok' ? '' :
                        platform === 'youtube' ? '' :
                        platform === 'facebook' ? '' : '';
                      
                      return (
                        <a
                          key={platform}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#f2cc0d] text-black font-medium rounded-lg hover:bg-[#d4b00b] transition-colors text-sm flex items-center gap-2"
                        >
                          {icon} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-[#212529] mb-4">מידע נוסף</h3>
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                {application.creators?.users_profiles?.display_name && (
                  <div>
                    <span className="text-[#6c757d] text-sm">שם מלא</span>
                    <div className="text-[#212529] font-medium text-lg">
                      {application.creators.users_profiles.display_name}
                    </div>
                  </div>
                )}
                {application.creators?.users_profiles?.email && (
                  <div>
                    <span className="text-[#6c757d] text-sm">אימייל</span>
                    <div className="text-[#212529] font-medium">
                      <a href={`mailto:${application.creators.users_profiles.email}`} className="hover:text-[#f2cc0d] transition-colors">
                        {application.creators.users_profiles.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Demographics */}
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-[#dee2e6]">
                {application.creators?.age && (
                  <div>
                    <span className="text-[#6c757d] text-sm">גיל</span>
                    <div className="text-[#212529] font-medium">{application.creators.age}</div>
                  </div>
                )}
                {application.creators?.gender && (
                  <div>
                    <span className="text-[#6c757d] text-sm">מגדר</span>
                    <div className="text-[#212529] font-medium">
                      {application.creators.gender === 'male' ? 'זכר' : 
                       application.creators.gender === 'female' ? 'נקבה' : 'אחר'}
                    </div>
                  </div>
                )}
                {application.creators?.country && (
                  <div>
                    <span className="text-[#6c757d] text-sm">מדינה</span>
                    <div className="text-[#212529] font-medium">{application.creators.country}</div>
                  </div>
                )}
              </div>

              {/* Niches */}
              {application.creators?.niches && application.creators.niches.length > 0 && (
                <div className="pt-4 border-t border-[#dee2e6]">
                  <span className="text-[#6c757d] text-sm block mb-2">תחומי עניין</span>
                  <div className="flex flex-wrap gap-2">
                    {application.creators.niches.map((niche, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#f8f9fa] rounded-full text-sm text-[#212529] border border-[#dee2e6]">
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {application.creators?.bio && (
                <div className="pt-4 border-t border-[#dee2e6]">
                  <span className="text-[#6c757d] text-sm block mb-2">אודות</span>
                  <p className="text-[#212529]">{application.creators.bio}</p>
                </div>
              )}

              {/* Tier & Metrics */}
              {(tier || metrics) && (
                <div className="pt-4 border-t border-[#dee2e6]">
                  <span className="text-[#6c757d] text-sm block mb-3">מדדי ביצוע</span>
                  
                  {tier && (
                    <div className="mb-4 bg-gradient-to-r from-[#f2cc0d]/20 to-[#f2cc0d]/10 border border-[#f2cc0d] rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <TierBadge 
                          tier={tier as TierLevel} 
                          showTooltip={true}
                        />
                        <div>
                          <div className="text-[#212529] font-bold">
                            דרגה: {tier === 'gold' ? 'זהב' : tier === 'silver' ? 'כסף' : 'ברונזה'}
                          </div>
                          <div className="text-[#6c757d] text-xs">
                            מבוסס על ביצועים קודמים. לחץ על התג לפירוט
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-surface rounded-lg p-3 border border-subtle">
                        <div className="text-muted text-xs mb-1">סה"כ משימות</div>
                        <div className="text-[#212529] font-bold text-lg">{metrics.total_tasks || 0}</div>
                      </div>
                      <div className="bg-surface rounded-lg p-3 border border-subtle">
                        <div className="text-muted text-xs mb-1">אחוז אישור</div>
                        <div className="text-green-400 font-bold text-lg">
                          {metrics.approval_rate ? `${Number(metrics.approval_rate).toFixed(0)}%` : '-'}
                        </div>
                      </div>
                      <div className="bg-surface rounded-lg p-3 border border-subtle">
                        <div className="text-muted text-xs mb-1">אספקה בזמן</div>
                        <div className="text-blue-400 font-bold text-lg">
                          {metrics.on_time_rate ? `${Number(metrics.on_time_rate).toFixed(0)}%` : '-'}
                        </div>
                      </div>
                      <div className="bg-surface rounded-lg p-3 border border-subtle">
                        <div className="text-muted text-xs mb-1">דירוג ממוצע</div>
                        <div className="text-gold font-bold text-lg">
                          {metrics.average_rating ? Number(metrics.average_rating).toFixed(1) : '-'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Social Media Platforms */}
              {application.creators?.platforms && typeof application.creators.platforms === 'object' && (
                <div className="pt-4 border-t border-[#dee2e6]">
                  <span className="text-[#6c757d] text-sm block mb-3">רשתות חברתיות</span>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(application.creators.platforms as Record<string, any>).map(([platform, data]: [string, any]) => (
                      <div key={platform} className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#212529] font-medium capitalize">
                            {platform === 'instagram' ? ' Instagram' :
                             platform === 'tiktok' ? ' TikTok' :
                             platform === 'youtube' ? ' YouTube' :
                             platform === 'facebook' ? ' Facebook' : platform}
                          </span>
                          {data?.followers && (
                            <span className="text-[#f2cc0d] text-sm font-bold">
                              {data.followers.toLocaleString()} עוקבים
                            </span>
                          )}
                        </div>
                        {data?.username && (
                          <div className="text-sm">
                            <span className="text-[#6c757d]">@</span>
                            <a 
                              href={
                                platform === 'instagram' ? `https://instagram.com/${data.username}` :
                                platform === 'tiktok' ? `https://tiktok.com/@${data.username}` :
                                platform === 'youtube' ? `https://youtube.com/@${data.username}` :
                                platform === 'facebook' ? `https://facebook.com/${data.username}` :
                                data.url || '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#212529] hover:text-[#f2cc0d] transition-colors"
                            >
                              {data.username}
                            </a>
                          </div>
                        )}
                        {data?.engagement_rate && (
                          <div className="text-xs text-[#6c757d] mt-1">
                            אחוז מעורבות: {(data.engagement_rate * 100).toFixed(2)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Proposal Details */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4">פרטי ההצעה ותמחור</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Fixed Price */}
                {application.campaigns?.fixed_price ? (
                  <div className="bg-[#f8f9fa] rounded-lg p-4 border-2 border-[#f2cc0d]">
                    <span className="text-[#6c757d] text-sm block mb-1">תשלום מוצע למשפיען</span>
                    <div className="text-3xl font-bold text-[#f2cc0d]">
                      ₪{application.campaigns.fixed_price.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#6c757d] mt-1">
                      מחיר קבוע לקמפיין
                    </div>
                    {application.status === 'submitted' && (
                      <button
                        onClick={() => {
                          setShowCustomPriceInput(!showCustomPriceInput);
                          if (!showCustomPriceInput) {
                            setCustomPrice(application.campaigns?.fixed_price?.toString() || '');
                          }
                        }}
                        className="mt-3 text-xs text-[#f2cc0d] hover:text-[#d4b00b] underline"
                      >
                        {showCustomPriceInput ? ' ביטול שינוי מחיר' : '️ שנה מחיר למשפיען זה'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#f8f9fa] rounded-lg p-4 border-2 border-[#f2cc0d]">
                    <span className="text-[#6c757d] text-sm block mb-1">תשלום למשפיען</span>
                    <div className="text-lg text-[#6c757d] mb-2">
                      לא הוגדר מחיר קבוע - קבע מחיר מותאם אישית
                    </div>
                    {application.status === 'submitted' && (
                      <button
                        onClick={() => setShowCustomPriceInput(!showCustomPriceInput)}
                        className="text-xs text-[#f2cc0d] hover:text-[#d4b00b] underline"
                      >
                        {showCustomPriceInput ? ' ביטול' : '️ הגדר מחיר'}
                      </button>
                    )}
                  </div>
                )}

                {/* Availability */}
                {application.availability && (
                  <div className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                    <span className="text-[#6c757d] text-sm block mb-1">זמינות לביצוע</span>
                    <div className="text-[#212529] font-medium">
                      {application.availability === 'immediate' && ' מיידי - יכול להתחיל מיד'}
                      {application.availability === 'within_week' && ' תוך שבוע'}
                      {application.availability === 'within_two_weeks' && ' תוך שבועיים'}
                      {application.availability === 'flexible' && ' גמיש - לפי צורכי הקמפיין'}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Price Input */}
              {showCustomPriceInput && application.status === 'submitted' && (
                <div className="bg-white border-2 border-[#f2cc0d] rounded-lg p-4">
                  <label className="block text-sm font-medium text-[#212529] mb-2">
                     מחיר מותאם אישית למשפיען זה (₪)
                  </label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="הזן סכום בשקלים"
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-lg focus:outline-none focus:border-gold transition-colors"
                    min="0"
                    step="1"
                  />
                  <p className="text-[#6c757d] text-xs mt-2">
                     המחיר שתזין כאן יחליף את המחיר הקבוע של הקמפיין עבור משפיען זה בלבד
                  </p>
                  {customPrice && parseFloat(customPrice) > 0 && (
                    <div className="mt-3 p-3 bg-[#f2cc0d]/10 border border-[#f2cc0d] rounded-lg">
                      <div className="text-[#212529] font-bold">
                        סכום לתשלום: ₪{parseFloat(customPrice).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Application Message */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4">למה לבחור במשפיען הזה?</h2>
            <p className="text-[#6c757d] whitespace-pre-wrap text-lg leading-relaxed">{application.message}</p>
            <div className="mt-4 pt-4 border-t border-[#dee2e6]">
              <span className="text-sm text-[#6c757d]">
                התקבל ב: {new Date(application.created_at).toLocaleDateString('he-IL')} {new Date(application.created_at).toLocaleTimeString('he-IL')}
              </span>
            </div>
          </Card>

          {/* Portfolio */}
          {portfolio.length > 0 && (
            <Card>
              <h2 className="text-xl font-bold text-[#212529] mb-4">תיק עבודות</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {portfolio.map((item) => (
                  <div key={item.id} className="bg-[#f8f9fa] rounded-lg overflow-hidden border border-[#dee2e6]">
                    <div className="aspect-square  bg-white">
                      {item.media_type === 'image' ? (
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-[#212529] font-medium text-sm mb-1">{item.title}</div>
                      {item.platform && (
                        <div className="text-xs text-[#f2cc0d]">{item.platform}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Portfolio Links */}
          {application.portfolio_links && (
            <Card>
              <h2 className="text-xl font-bold text-[#212529] mb-4">קישורים לעבודות</h2>
              <div className="space-y-2">
                {application.portfolio_links.split('\n').filter(link => link.trim()).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[#f8f9fa] rounded-lg border border-[#dee2e6] hover:border-[#f2cc0d] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      
                      <span className="text-[#212529] group-hover:text-[#f2cc0d] transition-colors break-all">
                        {link.trim()}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Reject Form */}
          {showRejectForm && (application.status === 'submitted' || application.status === 'approved') && (
            <Card className="border-2 border-red-500">
              <h2 className="text-xl font-bold text-[#212529] mb-4">
                {application.status === 'approved' ? 'שינוי החלטה - דחיית הבקשה' : 'דחיית הבקשה'}
              </h2>
              {application.status === 'approved' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                  <p className="text-orange-400 text-sm">
                    ️ שים לב: שינוי ההחלטה לא ימחק את המשימה שכבר נוצרה, אבל יעדכן את הסטטוס לנדחה.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#212529] mb-2">
                    סיבת הדחייה (חובה) *
                  </label>
                  <select
                    value={rejectReasonCode}
                    onChange={(e) => setRejectReasonCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                    required
                  >
                    <option value="">בחר סיבה...</option>
                    {rejectionReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#212529] mb-2">
                    הסבר מפורט (חובה - מינימום 10 תווים) *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="הסבר למשפיען למה הבקשה נדחתה והמלץ לו מה לשפר..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                    required
                    minLength={10}
                  />
                  <div className="text-xs text-[#6c757d] mt-1">
                    {rejectReason.length}/10 תווים מינימום
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleReject}
                    disabled={processing || !rejectReasonCode || !rejectReason.trim() || rejectReason.length < 10}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {processing ? 'מעבד...' : 'אשר דחייה'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                      setRejectReasonCode('');
                    }}
                    className="bg-[#f8f9fa] hover:bg-[#e9ecef]"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <TutorialPopup tutorialKey="brand_application_detail" />
    </div>
  );
}
