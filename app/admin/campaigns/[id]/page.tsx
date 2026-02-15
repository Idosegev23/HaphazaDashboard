'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Campaign = {
  id: string;
  title: string;
  status: string;
  brief: string | null;
  description: string | null;
  fixed_price: number | null;
  deadline: string | null;
  created_at: string;
  brand_id: string;
  brands: {
    brand_id: string;
    name: string;
  } | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  payment_amount: number | null;
  deadline: string | null;
  created_at: string;
  creator_id: string;
  creators: {
    user_id: string;
    niches: string[] | null;
    users_profiles: {
      display_name: string | null;
      email: string;
      avatar_url: string | null;
    } | null;
  } | null;
};

type Application = {
  id: string;
  status: string;
  created_at: string;
  message: string | null;
  creator_id: string;
  creators: {
    user_id: string;
    niches: string[] | null;
    users_profiles: {
      display_name: string | null;
      email: string;
      avatar_url: string | null;
    } | null;
  } | null;
};

export default function AdminCampaignDetailPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'kanban' | 'applications' | 'analytics'>('kanban');

  useEffect(() => {
    if (user && !['admin', 'support', 'content_ops'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    loadCampaign();
    loadTasks();
    loadApplications();
  }, [user?.id, params.id]);

  const loadCampaign = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, status, brief, description, fixed_price, deadline, created_at, brand_id, brands(brand_id, name)')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error loading campaign:', error);
      setLoading(false);
      return;
    }

    setCampaign(data as any);
    setLoading(false);
  };

  const loadTasks = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, status, payment_amount, deadline, created_at, creator_id, creators(user_id, niches, users_profiles(display_name, email, avatar_url))')
      .eq('campaign_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    setTasks(data as any || []);
  };

  const loadApplications = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('applications')
      .select('id, status, created_at, message, creator_id, creators(user_id, niches, users_profiles(display_name, email, avatar_url))')
      .eq('campaign_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading applications:', error);
      return;
    }

    setApplications(data as any || []);
  };

  const handleChangeTaskStatus = async (taskId: string, newStatus: 'selected' | 'in_production' | 'uploaded' | 'needs_edits' | 'approved' | 'paid' | 'disputed') => {
    if (!confirm(`Are you sure you want to change this task status to "${newStatus}"?`)) {
      return;
    }

    setProcessing(taskId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_actor_id: user!.id,
        p_action: 'admin_change_task_status',
        p_entity: 'tasks',
        p_entity_id: taskId,
        p_meta: { new_status: newStatus, campaign_id: params.id }
      });

      alert('✅ Task status changed successfully!');
      loadTasks();
    } catch (error: any) {
      console.error('Error changing task status:', error);
      alert('Error changing task status: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleChangeCampaignStatus = async (newStatus: 'draft' | 'open' | 'closed' | 'archived') => {
    if (!confirm(`Are you sure you want to change campaign status to "${newStatus}"?`)) {
      return;
    }

    setProcessing('campaign');
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', params.id);

      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_actor_id: user!.id,
        p_action: 'admin_change_campaign_status',
        p_entity: 'campaigns',
        p_entity_id: params.id,
        p_meta: { old_status: campaign?.status, new_status: newStatus }
      });

      alert('✅ Campaign status changed successfully!');
      loadCampaign();
    } catch (error: any) {
      console.error('Error changing campaign status:', error);
      alert('Error changing campaign status: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">קמפיין לא נמצא</div>
      </div>
    );
  }

  // Kanban columns
  const columns: Array<{ id: 'selected' | 'in_production' | 'uploaded' | 'needs_edits' | 'approved' | 'paid' | 'disputed'; label: string; color: string }> = [
    { id: 'selected', label: 'נבחרו', color: 'bg-blue-100' },
    { id: 'in_production', label: 'בביצוע', color: 'bg-yellow-100' },
    { id: 'uploaded', label: 'הועלה', color: 'bg-purple-100' },
    { id: 'needs_edits', label: 'דורש תיקון', color: 'bg-orange-100' },
    { id: 'approved', label: 'אושר', color: 'bg-green-100' },
    { id: 'paid', label: 'שולם', color: 'bg-[#f2cc0d]' },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter(t => t.status === status);
  };

  // Analytics calculations
  const uploadedCount = tasks.filter(t => ['uploaded', 'needs_edits', 'approved', 'paid'].includes(t.status)).length;
  const approvedCount = tasks.filter(t => ['approved', 'paid'].includes(t.status)).length;
  const approvalRate = uploadedCount > 0 ? ((approvedCount / uploadedCount) * 100).toFixed(1) : '0';
  
  const revisionCount = tasks.filter(t => t.status === 'needs_edits').length;
  const revisionRate = uploadedCount > 0 ? ((revisionCount / uploadedCount) * 100).toFixed(1) : '0';

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/campaigns">
              <button className="text-[#6c757d] hover:text-[#212529]">← חזרה</button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#212529] mb-2">{campaign.title}</h1>
              <p className="text-[#6c757d] mb-3">
                {campaign.brands?.name} • נוצר {new Date(campaign.created_at).toLocaleDateString('he-IL')}
                {campaign.deadline && ` • דדליין ${new Date(campaign.deadline).toLocaleDateString('he-IL')}`}
              </p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 ${campaign.status === 'open' ? 'bg-green-500' : campaign.status === 'draft' ? 'bg-gray-500' : campaign.status === 'closed' ? 'bg-blue-500' : 'bg-[#6c757d]'} text-white text-sm rounded-full`}>
                  {campaign.status === 'open' ? 'פתוח' : campaign.status === 'draft' ? 'טיוטה' : campaign.status === 'closed' ? 'סגור' : 'ארכיון'}
                </span>
                <span className="text-sm text-[#6c757d]">
                  תקציב: {campaign.fixed_price ? `₪${campaign.fixed_price}` : 'משתנה'}
                </span>
              </div>
            </div>

            {/* Admin Actions */}
            {user?.role === 'admin' && (
              <div className="flex flex-col gap-2">
                <div className="relative group">
                  <Button
                    disabled={processing === 'campaign'}
                    className="bg-[#6c757d] hover:bg-[#5a6268] text-white"
                  >
                    שנה סטטוס קמפיין
                  </Button>
                  <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-white border border-[#dee2e6] rounded-lg shadow-lg z-10 min-w-[150px]">
                    {(['draft', 'open', 'closed', 'archived'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleChangeCampaignStatus(status)}
                        disabled={processing === 'campaign' || campaign.status === status}
                        className="block w-full text-right px-4 py-2 text-sm text-[#212529] hover:bg-[#f8f9fa] disabled:opacity-50"
                      >
                        {status === 'draft' ? 'טיוטה' : status === 'open' ? 'פתוח' : status === 'closed' ? 'סגור' : 'ארכיון'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:px-8 border-b border-[#dee2e6] bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
            {['kanban', 'applications', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#f2cc0d] text-[#212529]'
                    : 'border-transparent text-[#6c757d] hover:text-[#212529]'
                }`}
              >
                {tab === 'kanban' ? 'משימות (Kanban)' : tab === 'applications' ? 'מועמדויות' : 'אנליטיקס'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'kanban' && (
            <div className="grid grid-cols-6 gap-4">
              {columns.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                return (
                  <div key={column.id} className="flex flex-col">
                    <div className={`${column.color} rounded-t-lg p-3 border-b-2 border-[#212529]`}>
                      <div className="font-bold text-[#212529] text-sm">{column.label}</div>
                      <div className="text-xs text-[#6c757d]">{columnTasks.length}</div>
                    </div>
                    <div className="space-y-2 mt-2 min-h-[200px]">
                      {columnTasks.map((task) => (
                        <Card key={task.id} className="p-3">
                          <div className="font-medium text-[#212529] text-sm mb-2">{task.title}</div>
                          <div className="flex items-center gap-2 mb-2">
                            {task.creators?.users_profiles?.avatar_url ? (
                              <img
                                src={task.creators.users_profiles.avatar_url}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#f2cc0d] flex items-center justify-center text-xs font-bold">
                                {(task.creators?.users_profiles?.display_name || task.creators?.users_profiles?.email || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="text-xs text-[#6c757d] truncate">
                              {task.creators?.users_profiles?.display_name || task.creators?.users_profiles?.email}
                            </div>
                          </div>
                          {task.payment_amount && (
                            <div className="text-xs font-bold text-[#f2cc0d] mb-2">₪{task.payment_amount}</div>
                          )}
                          
                          {user?.role === 'admin' && (
                            <div className="relative group">
                              <button className="text-xs text-blue-500 hover:underline">שנה סטטוס →</button>
                              <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-white border border-[#dee2e6] rounded-lg shadow-lg z-10 min-w-[120px]">
                                {columns.map(col => (
                                  <button
                                    key={col.id}
                                    onClick={() => handleChangeTaskStatus(task.id, col.id)}
                                    disabled={processing === task.id || task.status === col.id}
                                    className="block w-full text-right px-3 py-2 text-xs text-[#212529] hover:bg-[#f8f9fa] disabled:opacity-50"
                                  >
                                    {col.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'applications' && (
            <Card>
              <h2 className="text-xl font-bold text-[#212529] mb-4">מועמדויות ({applications.length})</h2>
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {app.creators?.users_profiles?.avatar_url ? (
                            <img
                              src={app.creators.users_profiles.avatar_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#f2cc0d] flex items-center justify-center font-bold">
                              {(app.creators?.users_profiles?.display_name || app.creators?.users_profiles?.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-[#212529]">
                              {app.creators?.users_profiles?.display_name || app.creators?.users_profiles?.email}
                            </div>
                            <div className="text-xs text-[#6c757d]">
                              {new Date(app.created_at).toLocaleDateString('he-IL')}
                            </div>
                            {app.message && (
                              <div className="text-sm text-[#6c757d] mt-2">{app.message}</div>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          app.status === 'approved' ? 'bg-green-500 text-white' :
                          app.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-yellow-500 text-[#212529]'
                        }`}>
                          {app.status === 'approved' ? 'אושר' : app.status === 'rejected' ? 'נדחה' : 'ממתין'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-[#6c757d]">אין מועמדויות</p>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-[#6c757d] text-xs mb-1">סה״כ משימות</div>
                  <div className="text-3xl font-bold text-[#f2cc0d]">{tasks.length}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[#6c757d] text-xs mb-1">שיעור אישור</div>
                  <div className="text-3xl font-bold text-green-500">{approvalRate}%</div>
                  <div className="text-xs text-[#6c757d] mt-1">{approvedCount}/{uploadedCount} הועלו</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[#6c757d] text-xs mb-1">שיעור תיקונים</div>
                  <div className="text-3xl font-bold text-orange-500">{revisionRate}%</div>
                  <div className="text-xs text-[#6c757d] mt-1">{revisionCount}/{uploadedCount} הועלו</div>
                </Card>
                <Card className="p-4">
                  <div className="text-[#6c757d] text-xs mb-1">מועמדויות</div>
                  <div className="text-3xl font-bold text-blue-500">{applications.length}</div>
                </Card>
              </div>

              {/* Campaign Info */}
              <Card>
                <h2 className="text-xl font-bold text-[#212529] mb-4">פרטי קמפיין</h2>
                <div className="space-y-3">
                  {campaign.description && (
                    <div>
                      <div className="text-sm font-bold text-[#6c757d] mb-1">תיאור</div>
                      <div className="text-[#212529]">{campaign.description}</div>
                    </div>
                  )}
                  {campaign.brief && (
                    <div>
                      <div className="text-sm font-bold text-[#6c757d] mb-1">בריף</div>
                      <div className="text-[#212529] whitespace-pre-wrap">{campaign.brief}</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
