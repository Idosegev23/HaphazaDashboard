'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TierBadge, TierLevel } from '@/components/ui/TierBadge';
import { TierLegend } from '@/components/creator/TierLegend';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

type Task = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  campaign_id: string;
};

type RevisionRequest = {
  id: string;
  task_id: string;
  status: string;
  tags: string[];
  note: string;
  created_at: string;
};

type Application = {
  id: string;
  status: string | null;
  created_at: string | null;
  campaign_id: string;
};

type CreatorMetrics = {
  total_tasks: number;
  approved_tasks: number;
  approval_rate: number;
  on_time_rate: number;
  average_rating: number;
};

type RatingBreakdown = {
  quality: number;
  communication: number;
  on_time: number;
  revision: number;
  totalRatings: number;
} | null;

type CreatorInfo = {
  tier: string | null;
};

export default function CreatorDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [tasksCount, setTasksCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [approvedAppsCount, setApprovedAppsCount] = useState(0);
  const [revisionsCount, setRevisionsCount] = useState(0);
  const [openRevisions, setOpenRevisions] = useState<RevisionRequest[]>([]);
  const [metrics, setMetrics] = useState<CreatorMetrics | null>(null);
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown>(null);
  const [loading, setLoading] = useState(true);
  const [showTierGuide, setShowTierGuide] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
    
    // Setup realtime subscriptions
    const supabase = createClient();
    const channel = supabase
      .channel('creator-dashboard')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
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
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/auth/login');
      return;
    }

    // Get user profile (optimized - select only needed fields)
    const { data: profile } = await supabase
      .from('users_profiles')
      .select('display_name, email, language')
      .eq('user_id', authUser.id)
      .single();

    setUser({ id: authUser.id, profile });

    // Get stats
    const { count: tasksCountData } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', authUser.id);

    const { count: pendingPaymentsCountData } = await supabase
      .from('payments')
      .select('task_id, tasks!inner(creator_id)', { count: 'exact', head: true })
      .eq('tasks.creator_id', authUser.id)
      .eq('status', 'pending');

    const { data: recentTasksData } = await supabase
      .from('tasks')
      .select('id, title, status, due_at, campaign_id')
      .eq('creator_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent applications (optimized - minimal fields)
    const { data: recentApplicationsData } = await supabase
      .from('applications')
      .select('id, status, created_at, campaign_id')
      .eq('creator_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(3);

    const approvedCount = recentApplicationsData?.filter(app => app.status === 'approved').length || 0;

    // Get open revision requests
    const { data: revisionsData } = await supabase
      .from('revision_requests')
      .select('id, task_id, status, tags, note, created_at, tasks!inner(creator_id)')
      .eq('tasks.creator_id', authUser.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Get creator metrics
    const { data: metricsData } = await supabase
      .from('creator_metrics')
      .select('total_tasks, approved_tasks, approval_rate, on_time_rate, average_rating')
      .eq('creator_id', authUser.id)
      .single();

    // Get creator info (tier)
    const { data: creatorData } = await supabase
      .from('creators')
      .select('tier')
      .eq('user_id', authUser.id)
      .single();

    // Get rating breakdown (C2)
    const { data: detailData } = await supabase.rpc('get_creator_profile_details' as any, {
      p_creator_id: authUser.id,
    });
    if (detailData && (detailData as any).ratingBreakdown) {
      setRatingBreakdown((detailData as any).ratingBreakdown);
    }

    setTasksCount(tasksCountData || 0);
    setPendingPaymentsCount(pendingPaymentsCountData || 0);
    setRecentTasks(recentTasksData as Task[] || []);
    setRecentApplications(recentApplicationsData as Application[] || []);
    setApprovedAppsCount(approvedCount);
    setRevisionsCount(revisionsData?.length || 0);
    setOpenRevisions(revisionsData as any || []);
    setMetrics(metricsData as any);
    setCreatorInfo(creatorData as any);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#212529] mb-2">
            שלום, {user?.profile?.display_name}
          </h1>
          <p className="text-muted">לוח הבקרה שלך</p>
        </div>

        {/* Tier Badge */}
        {creatorInfo?.tier && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-[#f2cc0d]/20 to-[#f2cc0d]/10 border-2 border-[#f2cc0d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TierBadge 
                    tier={(creatorInfo.tier as TierLevel) || 'starter'} 
                    showTooltip={false}
                    className="scale-125"
                  />
                  <div>
                    <div className="text-[#212529] font-bold text-xl">
                      הדרגה שלך: {
                        creatorInfo.tier === 'elite' ? ' Elite' :
                        creatorInfo.tier === 'pro' ? '⭐ Pro' :
                        creatorInfo.tier === 'verified' ? ' Verified' :
                        ' Starter'
                      }
                    </div>
                    <div className="text-[#6c757d] text-sm">
                      {metrics?.approved_tasks || 0} עבודות מאושרות
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowTierGuide(!showTierGuide)}
                  className="px-4 py-2 bg-[#f2cc0d] text-black font-bold rounded-lg hover:bg-[#d4b00b] transition-colors"
                >
                  {showTierGuide ? 'סגור מדריך' : ' מדריך דרגות'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Tier Guide (collapsible) */}
        {showTierGuide && (
          <div className="mb-6">
            <TierLegend />
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-muted text-sm mb-2">משימות פעילות</div>
            <div className="text-3xl font-bold text-gold">{tasksCount || 0}</div>
          </Card>
          <Card>
            <div className="text-muted text-sm mb-2">תשלומים ממתינים</div>
            <div className="text-3xl font-bold text-gold">{pendingPaymentsCount || 0}</div>
          </Card>
          <Card>
            <div className="text-muted text-sm mb-2">דירוג ממוצע</div>
            <div className="text-3xl font-bold text-gold">
              {metrics?.average_rating ? Number(metrics.average_rating).toFixed(1) : '-'}
            </div>
          </Card>
          <Card>
            <div className="text-muted text-sm mb-2">אחוז אישור</div>
            <div className="text-3xl font-bold text-gold">
              {metrics?.approval_rate ? `${Number(metrics.approval_rate).toFixed(0)}%` : '-'}
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        {metrics && (
          <Card className="mb-8">
            <h2 className="text-xl font-bold text-[#212529] mb-4">מדדי ביצוע</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-muted text-sm mb-2">סך משימות</div>
                <div className="text-2xl font-bold text-[#212529]">{metrics.total_tasks || 0}</div>
              </div>
              <div>
                <div className="text-muted text-sm mb-2">משימות מאושרות</div>
                <div className="text-2xl font-bold text-green-400">{metrics.approved_tasks || 0}</div>
              </div>
              <div>
                <div className="text-muted text-sm mb-2">אחוז אספקה בזמן</div>
                <div className="text-2xl font-bold text-blue-400">
                  {metrics.on_time_rate ? `${Number(metrics.on_time_rate).toFixed(0)}%` : '-'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Rating Breakdown (C2) */}
        {ratingBreakdown && ratingBreakdown.totalRatings > 0 && (
          <Card className="mb-8">
            <h2 className="text-xl font-bold text-[#212529] mb-4">פירוט דירוגים</h2>
            <div className="space-y-3">
              {[
                { label: 'איכות', value: ratingBreakdown.quality },
                { label: 'תקשורת', value: ratingBreakdown.communication },
                { label: 'עמידה בזמנים', value: ratingBreakdown.on_time },
                { label: 'תיקונים', value: ratingBreakdown.revision },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-[#6c757d] w-28 text-right flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-2.5 bg-[#f1f3f5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f2cc0d] rounded-full transition-all"
                      style={{ width: `${(item.value / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#212529] w-10 text-left">{item.value.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#adb5bd] mt-3">
              מבוסס על {ratingBreakdown.totalRatings} דירוגים
            </p>
          </Card>
        )}

        {/* Revision Requests Alert */}
        {revisionsCount > 0 && (
          <div className="mb-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 border-2 border-orange-400 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-3xl">️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#212529] mb-1">
                    יש לך {revisionsCount} {revisionsCount === 1 ? 'בקשת תיקון' : 'בקשות תיקון'}!
                  </h3>
                  <p className="text-orange-100">המותג ביקש תיקונים בעבודות שלך</p>
                  {openRevisions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {openRevisions.slice(0, 2).map((rev) => (
                        <div key={rev.id} className="text-sm text-orange-100">
                          • {rev.tags.join(', ')} - {rev.note.substring(0, 50)}...
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Link href="/creator/tasks">
                <button className="px-6 py-3 bg-white text-orange-700 font-bold rounded-lg hover:bg-orange-50 transition-all shadow-md">
                  לתיקונים →
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Approved Applications Alert */}
        {approvedAppsCount > 0 && (
          <div className="mb-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 border-2 border-green-400 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#212529] mb-1">
                    יש לך {approvedAppsCount} {approvedAppsCount === 1 ? 'בקשה מאושרת' : 'בקשות מאושרות'}!
                  </h3>
                  <p className="text-green-100">לחץ כדי לראות את המשימות החדשות שלך</p>
                </div>
              </div>
              <Link href="/creator/applications">
                <button className="px-6 py-3 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-all shadow-md">
                  לבקשות שלי →
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Applications */}
        {recentApplications && recentApplications.length > 0 && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#212529]">בקשות אחרונות</h2>
              <Link href="/creator/applications" className="text-[#f2cc0d] hover:text-[#d4b00b] text-sm font-medium">
                כל הבקשות →
              </Link>
            </div>
            <div className="space-y-3">
              {recentApplications.map((app) => {
                const statusLabels: Record<string, string> = {
                  submitted: 'ממתין',
                  approved: 'אושר! ',
                  rejected: 'נדחה',
                };
                const statusColors: Record<string, string> = {
                  submitted: 'bg-yellow-500',
                  approved: 'bg-green-500',
                  rejected: 'bg-red-500',
                };
                
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-surface border border-subtle rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-[#212529] font-medium mb-1">
                        בקשה #{app.id.substring(0, 8)}
                      </div>
                      <div className="text-sm text-muted">
                        {new Date(app.created_at || '').toLocaleDateString('he-IL')}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-[#212529] ${statusColors[app.status || 'submitted']}`}>
                      {statusLabels[app.status || 'submitted']}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent Tasks */}
        <Card>
          <h2 className="text-xl font-bold text-[#212529] mb-4">משימות אחרונות</h2>
          {recentTasks && recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-surface border border-subtle rounded-lg"
                >
                  <div>
                    <div className="text-[#212529] font-medium">{task.title}</div>
                    <div className="text-sm text-muted">
                      משימה #{task.id.substring(0, 8)}
                    </div>
                  </div>
                  <div className="text-sm text-gold">{task.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">אין משימות עדיין</p>
          )}
        </Card>
      </div>

      <TutorialPopup tutorialKey="creator_dashboard" />
    </div>
  );
}
