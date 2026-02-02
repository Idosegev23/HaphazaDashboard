'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Application = {
  id: string;
  message: string;
  status: string;
  created_at: string;
  proposed_price: number | null;
  availability: string | null;
  portfolio_links: string | null;
  campaigns: {
    title: string;
    budget_min: number | null;
    budget_max: number | null;
  } | null;
  creators: {
    niches: string[] | null;
    age_range: string | null;
    gender: string | null;
    country: string | null;
    platforms: any | null;
    bio: string | null;
    users_profiles: {
      display_name: string;
      email: string;
      language: string | null;
    } | null;
  } | null;
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
        proposed_price,
        availability,
        portfolio_links,
        campaigns(title, budget_min, budget_max)
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
        .select('display_name, email, language')
        .eq('user_id', (data as any).creator_id)
        .single();
      
      const { data: creatorData } = await supabase
        .from('creators')
        .select('niches, age_range, gender, country, platforms, bio')
        .eq('user_id', (data as any).creator_id)
        .single();
      
      if (profileData && creatorData) {
        (data as any).creators = Object.assign({}, creatorData, {
          users_profiles: profileData
        });
      }
    }

    setApplication(data as any);
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!confirm('האם אתה בטוח שברצונך לאשר את הבקשה? זה ייצור משימה אוטומטית עבור המשפיען.')) {
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    // Get application details with campaign info
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select('campaign_id, creator_id, proposed_price, campaigns(title, end_date, requires_product)')
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

    // Create task automatically
    const campaignData = appData.campaigns as any;
    const taskTitle = `משימה לקמפיין ${campaignData?.title || 'ללא שם'}`;
    const requiresProduct = campaignData?.requires_product || false;
    
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        campaign_id: appData.campaign_id,
        creator_id: appData.creator_id,
        title: taskTitle,
        status: 'selected',
        due_at: campaignData?.end_date || null,
        requires_product: requiresProduct,
        payment_amount: appData.proposed_price || 0,
      })
      .select('id')
      .single();

    if (taskError) {
      alert('הבקשה אושרה אבל היתה שגיאה ביצירת המשימה: ' + taskError.message);
      setProcessing(false);
      return;
    }

    // If requires product, create shipment request
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
        payment_amount: appData.proposed_price
      }
    });

    alert('✅ הבקשה אושרה בהצלחה!\n\nמשימה נוצרה אוטומטית עבור המשפיען.\nהמשפיען יראה את המשימה במערכת שלו.');
    
    // Reload the current page to show updated status
    loadApplication();
    setProcessing(false);
  };

  const handleReject = async () => {
    // ולידציה חובה
    if (!rejectReasonCode) {
      alert('יש לבחור סיבת דחייה');
      return;
    }
    if (!rejectReason.trim() || rejectReason.length < 10) {
      alert('יש להזין הסבר מפורט (לפחות 10 תווים)');
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      // קודם כל יוצרים את הפידבק
      const { error: feedbackError } = await supabase
        .from('application_feedback')
        .insert({
          application_id: applicationId,
          decision: 'reject',
          reason_code: rejectReasonCode as 'not_relevant' | 'low_quality_profile' | 'insufficient_followers' | 'wrong_niche' | 'timing_issue' | 'budget_mismatch' | 'other',
          note: rejectReason,
        });

      if (feedbackError) throw feedbackError;

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
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">בקשה לא נמצאה</div>
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
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/brand/applications')}
                className="text-[#cbc190] hover:text-[#f2cc0d] transition-colors"
              >
                ← חזרה
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">בקשת משפיען</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[application.status]}`}>
                {statusLabels[application.status]}
              </span>
              {application.campaigns && (
                <span className="text-[#cbc190] text-sm">
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Creator Info */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">פרטי המשפיען</h2>
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#cbc190] text-sm">שם מלא</span>
                  <div className="text-white font-medium text-lg">
                    {application.creators?.users_profiles?.display_name || 'לא זמין'}
                  </div>
                </div>
                {application.creators?.users_profiles?.email && (
                  <div>
                    <span className="text-[#cbc190] text-sm">אימייל</span>
                    <div className="text-white font-medium">
                      <a href={`mailto:${application.creators.users_profiles.email}`} className="hover:text-[#f2cc0d] transition-colors">
                        {application.creators.users_profiles.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Demographics */}
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-[#494222]">
                {application.creators?.age_range && (
                  <div>
                    <span className="text-[#cbc190] text-sm">גיל</span>
                    <div className="text-white font-medium">{application.creators.age_range}</div>
                  </div>
                )}
                {application.creators?.gender && (
                  <div>
                    <span className="text-[#cbc190] text-sm">מגדר</span>
                    <div className="text-white font-medium">
                      {application.creators.gender === 'male' ? 'זכר' : 
                       application.creators.gender === 'female' ? 'נקבה' : 'אחר'}
                    </div>
                  </div>
                )}
                {application.creators?.country && (
                  <div>
                    <span className="text-[#cbc190] text-sm">מדינה</span>
                    <div className="text-white font-medium">{application.creators.country}</div>
                  </div>
                )}
              </div>

              {/* Niches */}
              {application.creators?.niches && application.creators.niches.length > 0 && (
                <div className="pt-4 border-t border-[#494222]">
                  <span className="text-[#cbc190] text-sm block mb-2">תחומי עניין</span>
                  <div className="flex flex-wrap gap-2">
                    {application.creators.niches.map((niche, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#2e2a1b] rounded-full text-sm text-white border border-[#494222]">
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {application.creators?.bio && (
                <div className="pt-4 border-t border-[#494222]">
                  <span className="text-[#cbc190] text-sm block mb-2">אודות</span>
                  <p className="text-white">{application.creators.bio}</p>
                </div>
              )}

              {/* Social Media Platforms */}
              {application.creators?.platforms && typeof application.creators.platforms === 'object' && (
                <div className="pt-4 border-t border-[#494222]">
                  <span className="text-[#cbc190] text-sm block mb-3">רשתות חברתיות</span>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(application.creators.platforms as Record<string, any>).map(([platform, data]: [string, any]) => (
                      <div key={platform} className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium capitalize">
                            {platform === 'instagram' ? '📸 Instagram' :
                             platform === 'tiktok' ? '🎵 TikTok' :
                             platform === 'youtube' ? '📺 YouTube' :
                             platform === 'facebook' ? '👤 Facebook' : platform}
                          </span>
                          {data?.followers && (
                            <span className="text-[#f2cc0d] text-sm font-bold">
                              {data.followers.toLocaleString()} עוקבים
                            </span>
                          )}
                        </div>
                        {data?.username && (
                          <div className="text-sm">
                            <span className="text-[#cbc190]">@</span>
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
                              className="text-white hover:text-[#f2cc0d] transition-colors"
                            >
                              {data.username}
                            </a>
                          </div>
                        )}
                        {data?.engagement_rate && (
                          <div className="text-xs text-[#cbc190] mt-1">
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
            <h2 className="text-xl font-bold text-white mb-4">פרטי ההצעה</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Proposed Price */}
              {application.proposed_price && (
                <div className="bg-[#2e2a1b] rounded-lg p-4 border-2 border-[#f2cc0d]">
                  <span className="text-[#cbc190] text-sm block mb-1">מחיר מוצע</span>
                  <div className="text-3xl font-bold text-[#f2cc0d]">
                    ₪{application.proposed_price.toLocaleString()}
                  </div>
                  {application.campaigns?.budget_min && application.campaigns?.budget_max && (
                    <div className="text-xs text-[#cbc190] mt-1">
                      תקציב הקמפיין: ₪{application.campaigns.budget_min}-{application.campaigns.budget_max}
                    </div>
                  )}
                </div>
              )}

              {/* Availability */}
              {application.availability && (
                <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                  <span className="text-[#cbc190] text-sm block mb-1">זמינות לביצוע</span>
                  <div className="text-white font-medium">
                    {application.availability === 'immediate' && '🟢 מיידי - יכול להתחיל מיד'}
                    {application.availability === 'within_week' && '🟡 תוך שבוע'}
                    {application.availability === 'within_two_weeks' && '🟠 תוך שבועיים'}
                    {application.availability === 'flexible' && '🔵 גמיש - לפי צורכי הקמפיין'}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Application Message */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">למה לבחור במשפיען הזה?</h2>
            <p className="text-[#cbc190] whitespace-pre-wrap text-lg leading-relaxed">{application.message}</p>
            <div className="mt-4 pt-4 border-t border-[#494222]">
              <span className="text-sm text-[#cbc190]">
                התקבל ב: {new Date(application.created_at).toLocaleDateString('he-IL')} {new Date(application.created_at).toLocaleTimeString('he-IL')}
              </span>
            </div>
          </Card>

          {/* Portfolio Links */}
          {application.portfolio_links && (
            <Card>
              <h2 className="text-xl font-bold text-white mb-4">עבודות קודמות</h2>
              <div className="space-y-2">
                {application.portfolio_links.split('\n').filter(link => link.trim()).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[#2e2a1b] rounded-lg border border-[#494222] hover:border-[#f2cc0d] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔗</span>
                      <span className="text-white group-hover:text-[#f2cc0d] transition-colors break-all">
                        {link.trim()}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Reject Form */}
          {showRejectForm && application.status === 'submitted' && (
            <Card className="border-2 border-red-500">
              <h2 className="text-xl font-bold text-white mb-4">דחיית הבקשה</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    סיבת הדחייה (חובה) *
                  </label>
                  <select
                    value={rejectReasonCode}
                    onChange={(e) => setRejectReasonCode(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
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
                  <label className="block text-sm font-medium text-white mb-2">
                    הסבר מפורט (חובה - מינימום 10 תווים) *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="הסבר למשפיען למה הבקשה נדחתה והמלץ לו מה לשפר..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                    required
                    minLength={10}
                  />
                  <div className="text-xs text-[#cbc190] mt-1">
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
                    className="bg-[#2e2a1b] hover:bg-[#3a3525]"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
