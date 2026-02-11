'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';

type OverviewTabProps = {
  campaignId: string;
  campaign: any;
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

export function OverviewTab({ campaignId, campaign }: OverviewTabProps) {
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
        <div className="text-white text-xl">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Info */}
      <Card>
        <h2 className="text-xl font-bold text-white mb-4">פרטי קמפיין</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <span className="text-[#cbc190] text-sm">מחיר למשפיען</span>
            <div className="text-[#f2cc0d] font-bold text-2xl">
              ₪{campaign.fixed_price?.toLocaleString() || 0}
            </div>
          </div>
          {campaign.deadline && (
            <div>
              <span className="text-[#cbc190] text-sm">תאריך יעד</span>
              <div className="text-white font-medium">
                {new Date(campaign.deadline).toLocaleDateString('he-IL')}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Applications */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">👥</span>
            <div className="text-right">
              <div className="text-[#cbc190] text-sm">בקשות מועמדות</div>
              <div className="text-3xl font-bold text-white">{stats?.totalApplications || 0}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="text-green-400 font-bold">{stats?.approvedApplications || 0}</div>
              <div className="text-[#cbc190] text-xs">אושרו</div>
            </div>
            <div>
              <div className="text-yellow-400 font-bold">{stats?.pendingApplications || 0}</div>
              <div className="text-[#cbc190] text-xs">ממתינים</div>
            </div>
            <div>
              <div className="text-red-400 font-bold">{stats?.rejectedApplications || 0}</div>
              <div className="text-[#cbc190] text-xs">נדחו</div>
            </div>
          </div>
        </Card>

        {/* Tasks */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">📋</span>
            <div className="text-right">
              <div className="text-[#cbc190] text-sm">משימות</div>
              <div className="text-3xl font-bold text-white">
                {(stats?.activeTasks || 0) + (stats?.completedTasks || 0)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <div className="text-yellow-400 font-bold">{stats?.activeTasks || 0}</div>
              <div className="text-[#cbc190] text-xs">פעילות</div>
            </div>
            <div>
              <div className="text-green-400 font-bold">{stats?.completedTasks || 0}</div>
              <div className="text-[#cbc190] text-xs">הושלמו</div>
            </div>
          </div>
        </Card>

        {/* Shipments */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30">
          <div className="flex items-start justify-between">
            <span className="text-4xl">📦</span>
            <div className="text-right">
              <div className="text-[#cbc190] text-sm">משלוחים ממתינים</div>
              <div className="text-3xl font-bold text-white">{stats?.pendingShipments || 0}</div>
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <div className="flex items-start justify-between">
            <span className="text-4xl">📤</span>
            <div className="text-right">
              <div className="text-[#cbc190] text-sm">תכנים מאושרים</div>
              <div className="text-3xl font-bold text-white">{stats?.approvedContent || 0}</div>
            </div>
          </div>
        </Card>

        {/* Payments */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">💰</span>
            <div className="text-right">
              <div className="text-[#cbc190] text-sm">תשלומים</div>
              <div className="text-3xl font-bold text-white">
                {(stats?.pendingPayments || 0) + (stats?.paidPayments || 0)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <div className="text-yellow-400 font-bold">{stats?.pendingPayments || 0}</div>
              <div className="text-[#cbc190] text-xs">ממתינים</div>
            </div>
            <div>
              <div className="text-green-400 font-bold">{stats?.paidPayments || 0}</div>
              <div className="text-[#cbc190] text-xs">שולמו</div>
            </div>
          </div>
        </Card>

        {/* Campaign Health */}
        <Card className="bg-gradient-to-br from-[#f2cc0d]/10 to-[#f2cc0d]/5 border-[#f2cc0d]/30">
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">📊</span>
            <div className="text-right">
              <div className="text-[#cbc190] text-sm">בריאות קמפיין</div>
              <div className="text-3xl font-bold text-[#f2cc0d]">
                {stats && stats.totalApplications > 0
                  ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
          <div className="text-[#cbc190] text-xs">אחוז אישור מועמדויות</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-[#2e2a1b] to-[#1E1E1E]">
        <h3 className="text-lg font-bold text-white mb-4">פעולות מהירות</h3>
        <div className="flex flex-wrap gap-3">
          {stats && stats.pendingApplications > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
              <span className="text-yellow-400 font-medium">
                ⚠️ {stats.pendingApplications} בקשות ממתינות לבדיקה
              </span>
            </div>
          )}
          {stats && stats.pendingShipments > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-2">
              <span className="text-orange-400 font-medium">
                📦 {stats.pendingShipments} משלוחים דורשים טיפול
              </span>
            </div>
          )}
          {stats && stats.pendingPayments > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
              <span className="text-green-400 font-medium">
                💰 {stats.pendingPayments} תשלומים ממתינים
              </span>
            </div>
          )}
          {stats &&
            stats.pendingApplications === 0 &&
            stats.pendingShipments === 0 &&
            stats.pendingPayments === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
                <span className="text-green-400 font-medium">✅ הכל מעודכן!</span>
              </div>
            )}
        </div>
      </Card>
    </div>
  );
}
