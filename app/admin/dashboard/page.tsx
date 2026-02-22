import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default async function AdminDashboardPage() {
  const user = await getUser();
  
  if (!user || !['admin', 'finance', 'support', 'content_ops'].includes(user.role || '')) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get system stats
  const { count: usersCount } = await supabase
    .from('users_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: creatorsCount } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true });

  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });

  const { count: campaignsCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true });

  const { count: activeCampaignsCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  const { count: paymentsCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Advanced metrics: Approval Rate
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('status');

  const uploadedTasks = allTasks?.filter(t => t.status && ['uploaded', 'needs_edits', 'approved', 'paid'].includes(t.status)).length || 0;
  const approvedTasks = allTasks?.filter(t => t.status && ['approved', 'paid'].includes(t.status)).length || 0;
  const approvalRate = uploadedTasks > 0 ? ((approvedTasks / uploadedTasks) * 100).toFixed(1) : '0';

  // Advanced metrics: Revision Rate
  const needsEditsTasks = allTasks?.filter(t => t.status === 'needs_edits').length || 0;
  const revisionRate = uploadedTasks > 0 ? ((needsEditsTasks / uploadedTasks) * 100).toFixed(1) : '0';

  // Payment Anomalies: Late payments (pending for more than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: latePayments } = await supabase
    .from('payments')
    .select('id, amount, created_at, tasks(title, creators(users_profiles(display_name, email)))')
    .eq('status', 'pending')
    .lt('created_at', sevenDaysAgo.toISOString());

  // Active Users (with activity in last 30 days - approximate with created_at for now)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: activeCreatorsCount } = await supabase
    .from('tasks')
    .select('creator_id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Blocked users count
  const { count: blockedUsersCount } = await supabase
    .from('users_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_blocked', true);

  // Pending creators count
  const { data: pendingData } = await supabase.rpc('get_pending_creators_count');
  const pendingCreatorsCount = pendingData || 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#212529] mb-2">🎛️ לוח בקרה ראשי</h1>
          <p className="text-[#6c757d]">מערכת ניהול Leaders</p>
        </div>

        {/* System Health - Basic Stats */}
        <div>
          <h2 className="text-xl font-bold text-[#212529] mb-4">📊 נתונים כלליים</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">סה"כ משתמשים</div>
              <div className="text-3xl font-bold text-[#f2cc0d]">{usersCount || 0}</div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-[#6c757d]">משפיענים: {creatorsCount || 0}</span>
                <span className="text-[#6c757d]">•</span>
                <span className="text-[#6c757d]">מותגים: {brandsCount || 0}</span>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">קמפיינים פעילים</div>
              <div className="text-3xl font-bold text-green-500">{activeCampaignsCount || 0}</div>
              <div className="text-xs text-[#6c757d] mt-2">
                סה"כ: {campaignsCount || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">משימות פעילות</div>
              <div className="text-3xl font-bold text-[#f2cc0d]">{tasksCount || 0}</div>
              <div className="text-xs text-[#6c757d] mt-2">
                בייצור
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">תשלומים ממתינים</div>
              <div className="text-3xl font-bold text-yellow-500">{paymentsCount || 0}</div>
              <div className="text-xs text-[#6c757d] mt-2">
                ממתינים לטיפול
              </div>
            </Card>
          </div>
        </div>

        {/* Quality Metrics */}
        <div>
          <h2 className="text-xl font-bold text-[#212529] mb-4">📈 מדדי איכות וביצועים</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">שיעור אישור</div>
              <div className="text-4xl font-bold text-green-500">{approvalRate}%</div>
              <div className="text-xs text-[#6c757d] mt-2">
                {approvedTasks} אושרו / {uploadedTasks} הועלו
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">שיעור תיקונים</div>
              <div className="text-4xl font-bold text-orange-500">{revisionRate}%</div>
              <div className="text-xs text-[#6c757d] mt-2">
                {needsEditsTasks} דורשים תיקון / {uploadedTasks} הועלו
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">משפיענים פעילים (30 יום)</div>
              <div className="text-4xl font-bold text-blue-500">{activeCreatorsCount || 0}</div>
              <div className="text-xs text-[#6c757d] mt-2">
                עם פעילות בחודש האחרון
              </div>
            </Card>
          </div>
        </div>

        {/* Payment Alerts */}
        {latePayments && latePayments.length > 0 && (
          <Card className="border-l-4 border-red-500">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ התראות תשלום</h2>
            <p className="text-sm text-[#6c757d] mb-4">
              {latePayments.length} תשלומים ממתינים מעל 7 יום
            </p>
            <div className="space-y-2">
              {latePayments.slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-[#212529] text-sm">
                        {payment.tasks?.title || 'משימה ללא שם'}
                      </div>
                      <div className="text-xs text-[#6c757d]">
                        {payment.tasks?.creators?.users_profiles?.display_name || payment.tasks?.creators?.users_profiles?.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">₪{payment.amount}</div>
                      <div className="text-xs text-[#6c757d]">
                        {payment.created_at ? Math.floor((new Date().getTime() - new Date(payment.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0} ימים
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/payments">
              <div className="mt-4 text-sm text-red-600 hover:underline">צפה בכל התשלומים הממתינים →</div>
            </Link>
          </Card>
        )}

        {/* Pending Creators Alert */}
        {pendingCreatorsCount > 0 && (
          <Card className="bg-orange-50 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#212529]">👤 משפיענים ממתינים לאישור</h3>
                <p className="text-sm text-[#6c757d]">{pendingCreatorsCount} משפיענים חדשים ממתינים לאישור</p>
              </div>
              <Link href="/admin/users?status=pending_approval">
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  אשר עכשיו
                </button>
              </Link>
            </div>
          </Card>
        )}

        {/* System Alerts */}
        {blockedUsersCount && blockedUsersCount > 0 && (
          <Card className="bg-yellow-50 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#212529]">🚫 משתמשים חסומים</h3>
                <p className="text-sm text-[#6c757d]">{blockedUsersCount} משתמשים חסומים כרגע</p>
              </div>
              <Link href="/admin/users?status=blocked">
                <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                  בדוק
                </button>
              </Link>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-bold text-[#212529] mb-4">⚡ פעולות מהירות</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <Link href="/admin/users">
              <div className="glass-panel-hover p-6 rounded-lg text-center cursor-pointer">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-[#212529] font-medium">משתמשים</div>
              </div>
            </Link>
            <Link href="/admin/campaigns">
              <div className="glass-panel-hover p-6 rounded-lg text-center cursor-pointer">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-[#212529] font-medium">קמפיינים</div>
              </div>
            </Link>
            <Link href="/admin/payments">
              <div className="glass-panel-hover p-6 rounded-lg text-center cursor-pointer">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-[#212529] font-medium">תשלומים</div>
              </div>
            </Link>
            <Link href="/admin/disputes">
              <div className="glass-panel-hover p-6 rounded-lg text-center cursor-pointer">
                <div className="text-4xl mb-2">⚖️</div>
                <div className="text-[#212529] font-medium">סכסוכים</div>
              </div>
            </Link>
            <Link href="/admin/logs">
              <div className="glass-panel-hover p-6 rounded-lg text-center cursor-pointer">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-[#212529] font-medium">לוג ביקורת</div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
