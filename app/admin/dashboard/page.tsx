import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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

  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  const { count: paymentsCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-[#cbc190]">System Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">Total Users</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{usersCount || 0}</div>
          </Card>
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">Creators</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{creatorsCount || 0}</div>
          </Card>
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">Brands</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{brandsCount || 0}</div>
          </Card>
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">Campaigns</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{campaignsCount || 0}</div>
          </Card>
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">Active Tasks</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{tasksCount || 0}</div>
          </Card>
          <Card>
            <div className="text-[#cbc190] text-sm mb-2">Pending Payments</div>
            <div className="text-3xl font-bold text-[#f2cc0d]">{paymentsCount || 0}</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <a href="/admin/users">
              <div className="glass-panel-hover p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-white font-medium">Users</div>
              </div>
            </a>
            <a href="/admin/campaigns">
              <div className="glass-panel-hover p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-white font-medium">Campaigns</div>
              </div>
            </a>
            <a href="/admin/payments">
              <div className="glass-panel-hover p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-white font-medium">Payments</div>
              </div>
            </a>
            <a href="/admin/logs">
              <div className="glass-panel-hover p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-white font-medium">Audit Logs</div>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
