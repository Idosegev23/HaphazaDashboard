'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Task = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  campaign_id: string;
};

type Application = {
  id: string;
  status: string | null;
  created_at: string | null;
  campaign_id: string;
};

export default function CreatorDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [tasksCount, setTasksCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [approvedAppsCount, setApprovedAppsCount] = useState(0);
  const [loading, setLoading] = useState(true);
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

    setTasksCount(tasksCountData || 0);
    setPendingPaymentsCount(pendingPaymentsCountData || 0);
    setRecentTasks(recentTasksData as Task[] || []);
    setRecentApplications(recentApplicationsData as Application[] || []);
    setApprovedAppsCount(approvedCount);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            שלום, {user?.profile?.display_name}
          </h1>
          <p className="text-[#cbc190]">לוח הבקרה שלך</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">משימות פעילות</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{tasksCount || 0}</div>
          </Card>
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">תשלומים ממתינים</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{pendingPaymentsCount || 0}</div>
          </Card>
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">דירוג ממוצע</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">-</div>
          </Card>
        </div>

        {/* Approved Applications Alert */}
        {approvedAppsCount > 0 && (
          <div className="mb-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 border-2 border-green-400 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
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
              <h2 className="text-xl font-bold text-white">בקשות אחרונות</h2>
              <Link href="/creator/applications" className="text-[#f2cc0d] hover:text-[#d4b00b] text-sm font-medium">
                כל הבקשות →
              </Link>
            </div>
            <div className="space-y-3">
              {recentApplications.map((app) => {
                const statusLabels: Record<string, string> = {
                  submitted: 'ממתין',
                  approved: 'אושר! 🎉',
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
                    className="flex items-center justify-between p-4 bg-[#2e2a1b] rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">
                        בקשה #{app.id.substring(0, 8)}
                      </div>
                      <div className="text-sm text-[#cbc190]">
                        {new Date(app.created_at || '').toLocaleDateString('he-IL')}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[app.status || 'submitted']}`}>
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
          <h2 className="text-xl font-bold text-white mb-4">משימות אחרונות</h2>
          {recentTasks && recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-[#2e2a1b] rounded-lg"
                >
                  <div>
                    <div className="text-white font-medium">{task.title}</div>
                    <div className="text-sm text-[#cbc190]">
                      משימה #{task.id.substring(0, 8)}
                    </div>
                  </div>
                  <div className="text-sm text-[#f2cc0d]">{task.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#cbc190]">אין משימות עדיין</p>
          )}
        </Card>
      </div>
    </div>
  );
}
