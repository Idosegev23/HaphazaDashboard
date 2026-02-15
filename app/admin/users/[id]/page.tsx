'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type UserDetails = {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  is_blocked: boolean | null;
  created_at: string;
  creators?: {
    user_id: string;
    niches: string[] | null;
    tier: string | null;
    verified_at: string | null;
    bio: string | null;
    platforms: any;
  } | null;
  brands?: {
    brand_id: string;
    name: string;
    verified_at: string | null;
    website: string | null;
    industry: string | null;
  } | null;
};

type Stats = {
  campaigns: number;
  tasks: number;
  payments: number;
  totalSpent?: number;
  approvalRate?: number;
  avgRating?: number;
};

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  created_at: string | null;
  meta: any;
};

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'activity'>('overview');
  const [processing, setProcessing] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (user && !['admin', 'support'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    loadUserDetails();
    loadStats();
    loadAuditLogs();
  }, [user?.id, params.id]);

  const loadUserDetails = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('users_profiles')
      .select('user_id, email, display_name, avatar_url, is_blocked, created_at, creators(user_id, niches, tier, verified_at, bio, platforms), brands(brand_id, name, verified_at, website, industry)')
      .eq('user_id', params.id)
      .single();

    if (error) {
      console.error('Error loading user:', error);
      setLoading(false);
      return;
    }

    // Get role from auth.users via RPC or from current user if admin
    setUserDetails(data as any);
    // Default role to 'creator' if not found
    setNewRole('creator');
    setLoading(false);
  };

  const loadStats = async () => {
    const supabase = createClient();

    if (!userDetails) return;

    if (userDetails.creators) {
      // Creator stats
      const { count: campaignsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', params.id)
        .eq('status', 'approved');

      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', params.id);

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('status')
        .eq('creator_id', params.id);

      const { count: paymentsCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', params.id);

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('quality, communication, on_time')
        .eq('task_id', params.id);

      const approvedTasks = tasksData?.filter(t => t.status && (t.status === 'approved' || t.status === 'paid')).length || 0;
      const uploadedTasks = tasksData?.filter(t => t.status && ['uploaded', 'needs_edits', 'approved', 'paid'].includes(t.status)).length || 0;
      
      const avgRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum, r) => sum + ((r.quality || 0) + (r.communication || 0) + (r.on_time || 0)) / 3, 0) / ratingsData.length
        : 0;

      setStats({
        campaigns: campaignsCount || 0,
        tasks: tasksCount || 0,
        payments: paymentsCount || 0,
        approvalRate: uploadedTasks > 0 ? (approvedTasks / uploadedTasks) * 100 : 0,
        avgRating: avgRating,
      });
    } else if (userDetails.brands) {
      // Brand stats
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', userDetails.brands.brand_id);

      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*, campaigns!inner(brand_id)', { count: 'exact', head: true })
        .eq('campaigns.brand_id', userDetails.brands.brand_id);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, tasks!inner(campaigns!inner(brand_id))')
        .eq('tasks.campaigns.brand_id', userDetails.brands.brand_id);

      const totalSpent = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        campaigns: campaignsCount || 0,
        tasks: tasksCount || 0,
        payments: paymentsData?.length || 0,
        totalSpent: totalSpent,
      });
    }
  };

  const loadAuditLogs = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, entity, created_at, meta')
      .or(`actor_id.eq.${params.id},entity_id.eq.${params.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading audit logs:', error);
      return;
    }

    setAuditLogs(data || []);
  };

  const handleBlockUser = async (shouldBlock: boolean) => {
    if (!confirm(`Are you sure you want to ${shouldBlock ? 'block' : 'unblock'} this user?`)) {
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({ is_blocked: shouldBlock })
        .eq('user_id', params.id);

      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_action: shouldBlock ? 'block_user' : 'unblock_user',
        p_entity: 'users_profiles',
        p_entity_id: params.id,
        p_metadata: {}
      });

      alert(`✅ User ${shouldBlock ? 'blocked' : 'unblocked'} successfully!`);
      loadUserDetails();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!userDetails || !confirm('Are you sure you want to verify this user?')) {
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      const table = userDetails.creators ? 'creators' : 'brands';
      const { error } = await supabase
        .from(table)
        .update({ verified_at: new Date().toISOString() })
        .eq('user_id', params.id);

      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_action: 'verify_user',
        p_entity: table,
        p_entity_id: params.id,
        p_metadata: {}
      });

      alert('✅ User verified successfully!');
      loadUserDetails();
    } catch (error: any) {
      console.error('Error verifying user:', error);
      alert('Error verifying user: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleChangeRole = async () => {
    // TODO: Implement role change via RPC function that updates auth.users.raw_user_meta_data
    alert('⚠️ Role management feature is under construction. Roles are stored in auth.users and require special RPC functions to update.');
    setEditingRole(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">משתמש לא נמצא</div>
      </div>
    );
  }

  const isVerified = !!(userDetails.creators?.verified_at || userDetails.brands?.verified_at);
  const userType = userDetails.creators ? 'Creator' : userDetails.brands ? 'Brand' : 'Admin';

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/users">
              <button className="text-[#6c757d] hover:text-[#212529]">← חזרה</button>
            </Link>
          </div>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {userDetails.avatar_url ? (
              <img
                src={userDetails.avatar_url}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#f2cc0d] flex items-center justify-center text-[#212529] font-bold text-3xl">
                {(userDetails.display_name || userDetails.email || '?')[0].toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#212529]">
                  {userDetails.display_name || userDetails.brands?.name || userDetails.email}
                </h1>
                {isVerified && (
                  <span className="text-blue-500 text-2xl" title="מאומת">✓</span>
                )}
                {userDetails.is_blocked && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">חסום</span>
                )}
              </div>
              <p className="text-[#6c757d] mb-2">{userDetails.email}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#e9ecef] text-[#212529] text-sm rounded-full">
                  {userType}
                </span>
                {userDetails.creators?.tier && (
                  <span className="px-3 py-1 bg-[#f2cc0d] text-[#212529] text-sm rounded-full">
                    {userDetails.creators.tier}
                  </span>
                )}
                <span className="px-3 py-1 bg-[#e9ecef] text-[#212529] text-sm rounded-full">
                  {userDetails.role}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {!isVerified && (userDetails.creators || userDetails.brands) && (
                <Button
                  onClick={handleVerifyUser}
                  disabled={processing}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  אמת משתמש
                </Button>
              )}
              <Button
                onClick={() => handleBlockUser(!userDetails.is_blocked)}
                disabled={processing}
                className={userDetails.is_blocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {userDetails.is_blocked ? 'בטל חסימה' : 'חסום משתמש'}
              </Button>
              {user?.role === 'admin' && (
                <Button
                  onClick={() => setEditingRole(!editingRole)}
                  className="bg-[#6c757d] hover:bg-[#5a6268]"
                >
                  שנה תפקיד
                </Button>
              )}
            </div>
          </div>

          {/* Role Editor */}
          {editingRole && (
            <Card className="mt-4 p-4">
              <div className="flex items-center gap-4">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-[#dee2e6] bg-white text-[#212529]"
                >
                  <option value="creator">Creator</option>
                  <option value="brand_user">Brand User</option>
                  <option value="brand_manager">Brand Manager</option>
                  <option value="admin">Admin</option>
                  <option value="finance">Finance</option>
                  <option value="support">Support</option>
                  <option value="content_ops">Content Ops</option>
                </select>
                <Button onClick={handleChangeRole} disabled={processing}>שמור</Button>
                <button onClick={() => setEditingRole(false)} className="text-[#6c757d] hover:text-[#212529]">
                  ביטול
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:px-8 border-b border-[#dee2e6] bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
            {['overview', 'history', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#f2cc0d] text-[#212529]'
                    : 'border-transparent text-[#6c757d] hover:text-[#212529]'
                }`}
              >
                {tab === 'overview' ? 'סקירה' : tab === 'history' ? 'היסטוריה' : 'פעילות'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              {stats && (
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-[#6c757d] text-xs mb-1">קמפיינים</div>
                    <div className="text-2xl font-bold text-[#f2cc0d]">{stats.campaigns}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-[#6c757d] text-xs mb-1">משימות</div>
                    <div className="text-2xl font-bold text-[#f2cc0d]">{stats.tasks}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-[#6c757d] text-xs mb-1">תשלומים</div>
                    <div className="text-2xl font-bold text-[#f2cc0d]">{stats.payments}</div>
                  </Card>
                  {stats.totalSpent !== undefined && (
                    <Card className="p-4">
                      <div className="text-[#6c757d] text-xs mb-1">סה״כ הוצאות</div>
                      <div className="text-2xl font-bold text-[#f2cc0d]">₪{stats.totalSpent.toLocaleString()}</div>
                    </Card>
                  )}
                  {stats.approvalRate !== undefined && (
                    <Card className="p-4">
                      <div className="text-[#6c757d] text-xs mb-1">שיעור אישור</div>
                      <div className="text-2xl font-bold text-[#f2cc0d]">{stats.approvalRate.toFixed(1)}%</div>
                    </Card>
                  )}
                  {stats.avgRating !== undefined && stats.avgRating > 0 && (
                    <Card className="p-4">
                      <div className="text-[#6c757d] text-xs mb-1">דירוג ממוצע</div>
                      <div className="text-2xl font-bold text-[#f2cc0d]">{stats.avgRating.toFixed(1)}/5</div>
                    </Card>
                  )}
                </div>
              )}

              {/* Profile Details */}
              <Card>
                <h2 className="text-xl font-bold text-[#212529] mb-4">פרטים אישיים</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-[#6c757d]">אימייל</div>
                    <div className="text-[#212529]">{userDetails.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#6c757d]">תאריך הצטרפות</div>
                    <div className="text-[#212529]">{userDetails.created_at ? new Date(userDetails.created_at).toLocaleDateString('he-IL') : '-'}</div>
                  </div>
                  {userDetails.creators?.niches && (
                    <div>
                      <div className="text-sm text-[#6c757d]">נישות</div>
                      <div className="flex gap-2 mt-1">
                        {userDetails.creators.niches.map((niche, i) => (
                          <span key={i} className="px-2 py-1 bg-[#e9ecef] text-[#212529] text-xs rounded">
                            {niche}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {userDetails.creators?.bio && (
                    <div>
                      <div className="text-sm text-[#6c757d]">ביו</div>
                      <div className="text-[#212529]">{userDetails.creators.bio}</div>
                    </div>
                  )}
                  {userDetails.brands?.website && (
                    <div>
                      <div className="text-sm text-[#6c757d]">אתר</div>
                      <a href={userDetails.brands.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {userDetails.brands.website}
                      </a>
                    </div>
                  )}
                  {userDetails.brands?.industry && (
                    <div>
                      <div className="text-sm text-[#6c757d]">תעשייה</div>
                      <div className="text-[#212529]">{userDetails.brands.industry}</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Links */}
              <Card>
                <h2 className="text-xl font-bold text-[#212529] mb-4">קישורים מהירים</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {userDetails.creators && (
                    <>
                      <Link href={`/admin/campaigns?creator=${params.id}`}>
                        <div className="p-4 bg-[#f8f9fa] rounded-lg hover:bg-[#e9ecef] cursor-pointer">
                          <div className="text-2xl mb-2">🎯</div>
                          <div className="font-medium text-[#212529]">קמפיינים</div>
                        </div>
                      </Link>
                      <Link href={`/creator/payments`}>
                        <div className="p-4 bg-[#f8f9fa] rounded-lg hover:bg-[#e9ecef] cursor-pointer">
                          <div className="text-2xl mb-2">💰</div>
                          <div className="font-medium text-[#212529]">תשלומים</div>
                        </div>
                      </Link>
                    </>
                  )}
                  {userDetails.brands && (
                    <>
                      <Link href={`/admin/campaigns?brand=${userDetails.brands.brand_id}`}>
                        <div className="p-4 bg-[#f8f9fa] rounded-lg hover:bg-[#e9ecef] cursor-pointer">
                          <div className="text-2xl mb-2">🎯</div>
                          <div className="font-medium text-[#212529]">קמפיינים</div>
                        </div>
                      </Link>
                      <Link href={`/admin/payments?brand=${userDetails.brands.brand_id}`}>
                        <div className="p-4 bg-[#f8f9fa] rounded-lg hover:bg-[#e9ecef] cursor-pointer">
                          <div className="text-2xl mb-2">💰</div>
                          <div className="font-medium text-[#212529]">תשלומים</div>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <Card>
              <h2 className="text-xl font-bold text-[#212529] mb-4">היסטוריית פעולות</h2>
              {auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-[#212529]">{log.action}</span>
                          <span className="text-[#6c757d] text-sm mx-2">•</span>
                          <span className="text-[#6c757d] text-sm">{log.entity}</span>
                        </div>
                        <div className="text-xs text-[#6c757d]">
                          {log.created_at ? new Date(log.created_at).toLocaleString('he-IL') : '-'}
                        </div>
                      </div>
                      {log.meta && Object.keys(log.meta).length > 0 && (
                        <div className="mt-2 text-xs text-[#6c757d]">
                          {JSON.stringify(log.meta)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-[#6c757d]">אין היסטוריית פעולות</p>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <h2 className="text-xl font-bold text-[#212529] mb-4">פעילות אחרונה</h2>
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔄</div>
                <p className="text-[#6c757d]">תצוגת פעילות בפיתוח</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
