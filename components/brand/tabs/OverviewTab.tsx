'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';

type OverviewTabProps = {
  campaignId: string;
  campaign: any;
  onTabChange?: (tabId: string) => void;
};

type Stats = {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  activeTasks: number;
  completedTasks: number;
  pendingShipments: number;
  approvedContent: number;
  pendingPayments: number;
  paidPayments: number;
};

export function OverviewTab({ campaignId, campaign, onTabChange }: OverviewTabProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [campaignId]);

  const loadStats = async () => {
    const supabase = createClient();

    // Applications stats
    const { count: totalApps } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    const { count: approvedApps } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'approved');

    const { count: rejectedApps } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'rejected');

    const { count: pendingApps } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'submitted');

    // Tasks stats
    const { count: activeTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('status', ['selected', 'in_production', 'uploaded', 'needs_edits']);

    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('status', ['approved', 'paid']);

    // Shipments stats
    const { count: pendingShipments } = await supabase
      .from('shipment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .neq('status', 'delivered');

    // Content stats
    const { count: approvedContent } = await supabase
      .from('uploads')
      .select('task_id, tasks!inner(campaign_id)', { count: 'exact', head: true })
      .eq('tasks.campaign_id', campaignId)
      .eq('status', 'approved');

    // Payments stats
    const { count: pendingPayments } = await supabase
      .from('payments')
      .select('task_id, tasks!inner(campaign_id)', { count: 'exact', head: true })
      .eq('tasks.campaign_id', campaignId)
      .eq('status', 'pending');

    const { count: paidPayments } = await supabase
      .from('payments')
      .select('task_id, tasks!inner(campaign_id)', { count: 'exact', head: true })
      .eq('tasks.campaign_id', campaignId)
      .eq('status', 'paid');

    setStats({
      totalApplications: totalApps || 0,
      approvedApplications: approvedApps || 0,
      rejectedApplications: rejectedApps || 0,
      pendingApplications: pendingApps || 0,
      activeTasks: activeTasks || 0,
      completedTasks: completedTasks || 0,
      pendingShipments: pendingShipments || 0,
      approvedContent: approvedContent || 0,
      pendingPayments: pendingPayments || 0,
      paidPayments: paidPayments || 0,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#212529] text-xl">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Info */}
      <Card>
        <h2 className="text-xl font-bold text-[#212529] mb-4">פרטי קמפיין</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-[#6c757d] text-sm">
              {campaign.is_barter ? 'סוג תשלום' : 'מחיר למשפיען'}
            </span>
            <div className="text-[#f2cc0d] font-bold text-2xl">
              {campaign.is_barter ? 'ברטר' : `₪${campaign.fixed_price?.toLocaleString() || 0}`}
            </div>
            {campaign.is_barter && campaign.barter_description && (
              <p className="text-[#6c757d] text-xs mt-1">{campaign.barter_description}</p>
            )}
          </div>
          {(campaign.start_date || campaign.end_date) && (
            <div>
              <span className="text-[#6c757d] text-sm">תקופת קמפיין</span>
              <div className="text-[#212529] font-medium">
                {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('he-IL') : '—'}
                {' - '}
                {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('he-IL') : '—'}
              </div>
            </div>
          )}
          {campaign.deadline && (
            <div>
              <span className="text-[#6c757d] text-sm">דדליין תוכן</span>
              <div className="text-[#212529] font-medium">
                {new Date(campaign.deadline).toLocaleDateString('he-IL')}
              </div>
            </div>
          )}
          <div>
            <span className="text-[#6c757d] text-sm">אישור ממומן</span>
            <div className="text-[#212529] font-medium">
              {campaign.requires_sponsored_approval !== false ? 'נדרש' : 'לא נדרש'}
            </div>
          </div>
          {campaign.submission_deadline && (
            <div>
              <span className="text-[#6c757d] text-sm">דדליין הגשה סופי</span>
              <div className="text-[#212529] font-medium">
                {new Date(campaign.submission_deadline).toLocaleDateString('he-IL')}
              </div>
            </div>
          )}
          {campaign.go_live_date && (
            <div>
              <span className="text-[#6c757d] text-sm">תאריך Go-Live</span>
              <div className="text-[#212529] font-medium">
                {new Date(campaign.go_live_date).toLocaleDateString('he-IL')}
              </div>
            </div>
          )}
          {campaign.max_revisions && (
            <div>
              <span className="text-[#6c757d] text-sm">מקס׳ תיקונים</span>
              <div className="text-[#212529] font-medium">{campaign.max_revisions}</div>
            </div>
          )}
          {campaign.platforms && campaign.platforms.length > 0 && (
            <div>
              <span className="text-[#6c757d] text-sm">פלטפורמות</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.platforms.map((p: string) => (
                  <span key={p} className="px-2 py-0.5 bg-[#f2cc0d]/15 text-[#212529] rounded-full text-xs font-medium capitalize">{p}</span>
                ))}
              </div>
            </div>
          )}
          {campaign.content_period_type && campaign.content_period_type !== 'campaign_dates' && (
            <div>
              <span className="text-[#6c757d] text-sm">תקופת פרסום</span>
              <div className="text-[#212529] font-medium">
                {campaign.content_period_type === 'calendar_month' ? 'חודש קלנדרי' :
                 campaign.publish_start && campaign.publish_end
                   ? `${new Date(campaign.publish_start).toLocaleDateString('he-IL')} - ${new Date(campaign.publish_end).toLocaleDateString('he-IL')}`
                   : 'טווח מותאם אישית'}
              </div>
            </div>
          )}
        </div>

        {/* Deliverables summary */}
        {campaign.deliverables && typeof campaign.deliverables === 'object' && (() => {
          const deliverables = campaign.deliverables as Record<string, any>;
          const labels: Record<string, string> = {
            instagram_story: 'Instagram Story',
            instagram_reel: 'Instagram Reel',
            instagram_post: 'Instagram Post',
            tiktok_video: 'TikTok Video',
            youtube_shorts: 'YouTube Shorts',
            ugc_video: 'UGC Video',
            photo: 'Photo',
          };
          const hasFixed = Object.entries(deliverables).some(([k, v]) => k !== '_options' && typeof v === 'number' && v > 0);
          const options = Array.isArray(deliverables._options) ? deliverables._options as Array<Array<{ type: string; count: number }>> : [];

          if (!hasFixed && options.length === 0) return null;

          return (
            <div className="mt-4 pt-4 border-t border-[#dee2e6]">
              {hasFixed && (
                <>
                  <span className="text-[#6c757d] text-sm block mb-2">תמהיל תוצרים נדרש</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(deliverables)
                      .filter(([k, v]) => k !== '_options' && typeof v === 'number' && v > 0)
                      .map(([key, count]) => {
                        const details = (campaign.deliverable_details as Record<string, { due_date?: string; notes?: string }> | null)?.[key];
                        return (
                          <div key={key} className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f2cc0d]/15 text-[#212529] rounded-full text-sm font-medium">
                              {count}x {labels[key] || key}
                            </span>
                            {details && (details.due_date || details.notes) && (
                              <span className="text-[10px] text-[#6c757d] mt-0.5 px-1">
                                {details.due_date && `עד ${new Date(details.due_date).toLocaleDateString('he-IL')}`}
                                {details.due_date && details.notes && ' · '}
                                {details.notes}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              {options.length > 0 && (
                <div className={hasFixed ? 'mt-4' : ''}>
                  <span className="text-[#6c757d] text-sm block mb-2">אפשרויות לבחירה (המשפיען בוחר אחת)</span>
                  <div className="space-y-2">
                    {options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[#f2cc0d] font-bold text-sm min-w-[70px]">אפשרות {idx + 1}:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {option.map((item, itemIdx) => (
                            <span key={itemIdx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/15 text-[#212529] rounded-full text-xs font-medium">
                              {item.count}x {labels[item.type] || item.type}
                            </span>
                          ))}
                        </div>
                        {idx < options.length - 1 && (
                          <span className="text-[#6c757d] text-xs font-medium">או</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Applications */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 cursor-pointer hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-3">
            
            <div className="text-right">
              <div className="text-[#6c757d] text-sm">בקשות מועמדות</div>
              <div className="text-3xl font-bold text-[#212529]">{stats?.totalApplications || 0}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <button
              onClick={() => onTabChange?.('applications')}
              className="hover:bg-white/5 rounded-lg p-2 transition-all cursor-pointer"
            >
              <div className="text-green-400 font-bold">{stats?.approvedApplications || 0}</div>
              <div className="text-[#6c757d] text-xs">אושרו</div>
            </button>
            <button
              onClick={() => onTabChange?.('applications')}
              className="hover:bg-white/5 rounded-lg p-2 transition-all cursor-pointer"
            >
              <div className="text-yellow-400 font-bold">{stats?.pendingApplications || 0}</div>
              <div className="text-[#6c757d] text-xs">ממתינים</div>
            </button>
            <button
              onClick={() => onTabChange?.('applications')}
              className="hover:bg-white/5 rounded-lg p-2 transition-all cursor-pointer"
            >
              <div className="text-red-400 font-bold">{stats?.rejectedApplications || 0}</div>
              <div className="text-[#6c757d] text-xs">נדחו</div>
            </button>
          </div>
        </Card>

        {/* Tasks */}
        <Card 
          className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onTabChange?.('applications')}
        >
          <div className="flex items-start justify-between mb-3">
            
            <div className="text-right">
              <div className="text-[#6c757d] text-sm">משימות</div>
              <div className="text-3xl font-bold text-[#212529]">
                {(stats?.activeTasks || 0) + (stats?.completedTasks || 0)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <div className="text-yellow-400 font-bold">{stats?.activeTasks || 0}</div>
              <div className="text-[#6c757d] text-xs">פעילות</div>
            </div>
            <div>
              <div className="text-green-400 font-bold">{stats?.completedTasks || 0}</div>
              <div className="text-[#6c757d] text-xs">הושלמו</div>
            </div>
          </div>
        </Card>

        {/* Shipments */}
        <Card 
          className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onTabChange?.('shipments')}
        >
          <div className="flex items-start justify-between">
            
            <div className="text-right">
              <div className="text-[#6c757d] text-sm">משלוחים ממתינים</div>
              <div className="text-3xl font-bold text-[#212529]">{stats?.pendingShipments || 0}</div>
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card 
          className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onTabChange?.('content')}
        >
          <div className="flex items-start justify-between">
            
            <div className="text-right">
              <div className="text-[#6c757d] text-sm">תכנים מאושרים</div>
              <div className="text-3xl font-bold text-[#212529]">{stats?.approvedContent || 0}</div>
            </div>
          </div>
        </Card>

        {/* Payments */}
        <Card 
          className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onTabChange?.('payments')}
        >
          <div className="flex items-start justify-between mb-3">
            
            <div className="text-right">
              <div className="text-[#6c757d] text-sm">תשלומים</div>
              <div className="text-3xl font-bold text-[#212529]">
                {(stats?.pendingPayments || 0) + (stats?.paidPayments || 0)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <div className="text-yellow-400 font-bold">{stats?.pendingPayments || 0}</div>
              <div className="text-[#6c757d] text-xs">ממתינים</div>
            </div>
            <div>
              <div className="text-green-400 font-bold">{stats?.paidPayments || 0}</div>
              <div className="text-[#6c757d] text-xs">שולמו</div>
            </div>
          </div>
        </Card>

        {/* Campaign Health */}
        <Card className="bg-gradient-to-br from-[#f2cc0d]/10 to-[#f2cc0d]/5 border-[#f2cc0d]/30">
          <div className="flex items-start justify-between mb-3">
            
            <div className="text-right">
              <div className="text-[#6c757d] text-sm">בריאות קמפיין</div>
              <div className="text-3xl font-bold text-[#f2cc0d]">
                {stats && stats.totalApplications > 0
                  ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
          <div className="text-[#6c757d] text-xs">אחוז אישור מועמדויות</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-[#f8f9fa] to-white">
        <h3 className="text-lg font-bold text-[#212529] mb-4">פעולות מהירות</h3>
        <div className="flex flex-wrap gap-3">
          {stats && stats.pendingApplications > 0 && (
            <button
              onClick={() => onTabChange?.('applications')}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 hover:bg-yellow-500/20 transition-all cursor-pointer"
            >
              <span className="text-yellow-600 font-medium">
                {stats.pendingApplications} בקשות ממתינות לבדיקה
              </span>
            </button>
          )}
          {stats && stats.pendingShipments > 0 && (
            <button
              onClick={() => onTabChange?.('shipments')}
              className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-2 hover:bg-orange-500/20 transition-all cursor-pointer"
            >
              <span className="text-orange-600 font-medium">
                {stats.pendingShipments} משלוחים דורשים טיפול
              </span>
            </button>
          )}
          {stats && stats.pendingPayments > 0 && (
            <button
              onClick={() => onTabChange?.('payments')}
              className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 hover:bg-green-500/20 transition-all cursor-pointer"
            >
              <span className="text-green-600 font-medium">
                {stats.pendingPayments} תשלומים ממתינים
              </span>
            </button>
          )}
          {stats &&
            stats.pendingApplications === 0 &&
            stats.pendingShipments === 0 &&
            stats.pendingPayments === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
                <span className="text-green-600 font-medium">הכל מעודכן!</span>
              </div>
            )}
        </div>
      </Card>
    </div>
  );
}
