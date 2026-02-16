'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Campaign = {
  id: string;
  title: string;
  status: string;
  fixed_price: number | null;
  created_at: string;
  deadline: string | null;
  brand_id: string;
  brands: {
    brand_id: string;
    name: string;
  } | null;
  _count: {
    applications: number;
    selections: number;
    tasks: number;
  };
  _tasks: {
    status: string;
  }[];
};

export default function AdminCampaignsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  
  // Stats
  const [totalApprovalRate, setTotalApprovalRate] = useState(0);

  useEffect(() => {
    if (user && !['admin', 'support', 'content_ops'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    loadCampaigns();
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [searchQuery, statusFilter, brandFilter, campaigns]);

  const loadCampaigns = async () => {
    const supabase = createClient();

    // Get all campaigns with related data
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, title, status, fixed_price, created_at, deadline, brand_id, brands(brand_id, name)')
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('Error loading campaigns:', campaignsError);
      setLoading(false);
      return;
    }

    // Get counts for each campaign
    const campaignsWithCounts = await Promise.all(
      (campaignsData || []).map(async (campaign) => {
        const { count: applicationsCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);

        const { count: selectionsCount } = await supabase
          .from('selections')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);

        const { count: tasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);

        const { data: tasksData } = await supabase
          .from('tasks')
          .select('status')
          .eq('campaign_id', campaign.id);

        return {
          ...campaign,
          _count: {
            applications: applicationsCount || 0,
            selections: selectionsCount || 0,
            tasks: tasksCount || 0,
          },
          _tasks: tasksData || [],
        };
      })
    );

    setCampaigns(campaignsWithCounts as any);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...campaigns];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(query) ||
        c.brands?.name?.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(c => c.brand_id === brandFilter);
    }

    setFilteredCampaigns(filtered);
  };

  const calculateStats = () => {
    const allTasks = campaigns.flatMap(c => c._tasks);
    const uploadedTasks = allTasks.filter(t => t.status && ['uploaded', 'needs_edits', 'approved', 'paid'].includes(t.status));
    const approvedTasks = allTasks.filter(t => t.status && ['approved', 'paid'].includes(t.status));
    
    const rate = uploadedTasks.length > 0 ? (approvedTasks.length / uploadedTasks.length) * 100 : 0;
    setTotalApprovalRate(rate);
  };

  const handleChangeStatus = async (campaignId: string, newStatus: 'draft' | 'open' | 'closed' | 'archived') => {
    const statusLabels: Record<string, string> = {
      draft: 'טיוטה',
      open: 'פתוח',
      closed: 'סגור',
      archived: 'בארכיון',
    };
    
    if (!confirm(`האם אתה בטוח שברצונך לשנות את הסטטוס ל"${statusLabels[newStatus]}"?`)) {
      return;
    }

    setProcessing(campaignId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_action: 'change_campaign_status',
        p_entity: 'campaigns',
        p_entity_id: campaignId,
        p_metadata: { new_status: newStatus }
      });

      alert('✅ סטטוס הקמפיין שונה בהצלחה!');
      loadCampaigns();
    } catch (error: any) {
      console.error('Error changing status:', error);
      alert('שגיאה בשינוי סטטוס: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      open: 'bg-green-500',
      closed: 'bg-blue-500',
      archived: 'bg-[#6c757d]',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'טיוטה',
      open: 'פתוח',
      closed: 'סגור',
      archived: 'בארכיון',
    };
    return labels[status] || status;
  };

  const getApprovalRate = (campaign: Campaign) => {
    const uploaded = campaign._tasks.filter(t => t.status && ['uploaded', 'needs_edits', 'approved', 'paid'].includes(t.status)).length;
    const approved = campaign._tasks.filter(t => t.status && ['approved', 'paid'].includes(t.status)).length;
    return uploaded > 0 ? ((approved / uploaded) * 100).toFixed(1) : '0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  // Get unique brands for filter
  const uniqueBrands = Array.from(
    new Set(
      campaigns
        .map(c => c.brands?.brand_id)
        .filter((id): id is string => !!id)
    )
  );
  const brandsMap = new Map(
    campaigns
      .filter((c): c is Campaign & { brands: { brand_id: string; name: string } } => 
        !!c.brands?.brand_id && !!c.brands?.name
      )
      .map(c => [c.brands.brand_id, c.brands.name] as const)
  );

  const statusOptions = [
    { value: 'all', label: 'כל הסטטוסים' },
    { value: 'draft', label: 'טיוטה' },
    { value: 'open', label: 'פתוח' },
    { value: 'closed', label: 'סגור' },
    { value: 'archived', label: 'ארכיון' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mb-2">🎯 ניהול קמפיינים</h1>
        <p className="text-[#6c757d]">ניהול קמפיינים, משימות והתערבות בחריגות</p>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 lg:px-8 border-b border-[#dee2e6] bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <Input
              type="text"
              placeholder="חיפוש לפי שם קמפיין או מותג..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#dee2e6] bg-white text-[#212529]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#dee2e6] bg-white text-[#212529]"
            >
              <option value="all">כל המותגים</option>
              {uniqueBrands.map(brandId => (
                <option key={brandId} value={brandId}>
                  {brandsMap.get(brandId)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">סה״כ קמפיינים</div>
              <div className="text-2xl font-bold text-[#f2cc0d]">{campaigns.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">פעילים</div>
              <div className="text-2xl font-bold text-green-500">
                {campaigns.filter(c => c.status === 'open').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">שיעור אישור כללי</div>
              <div className="text-2xl font-bold text-[#f2cc0d]">{totalApprovalRate.toFixed(1)}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">סה״כ משימות</div>
              <div className="text-2xl font-bold text-[#f2cc0d]">
                {campaigns.reduce((sum, c) => sum + c._count.tasks, 0)}
              </div>
            </Card>
          </div>

          {/* Campaigns List */}
          <Card>
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-[#212529]">{campaign.title}</h3>
                        <span className={`px-3 py-1 ${getStatusColor(campaign.status)} text-white text-xs rounded-full`}>
                          {getStatusLabel(campaign.status)}
                        </span>
                      </div>
                      <div className="text-sm text-[#6c757d] mb-2">
                        {campaign.brands?.name} • נוצר {new Date(campaign.created_at).toLocaleDateString('he-IL')}
                        {campaign.deadline && ` • דדליין ${new Date(campaign.deadline).toLocaleDateString('he-IL')}`}
                      </div>
                      
                      {/* Metrics */}
                      <div className="grid grid-cols-5 gap-4 mt-3">
                        <div>
                          <div className="text-xs text-[#6c757d]">מועמדות</div>
                          <div className="text-lg font-bold text-[#212529]">{campaign._count.applications}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#6c757d]">נבחרו</div>
                          <div className="text-lg font-bold text-[#f2cc0d]">{campaign._count.selections}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#6c757d]">משימות</div>
                          <div className="text-lg font-bold text-[#212529]">{campaign._count.tasks}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#6c757d]">שיעור אישור</div>
                          <div className="text-lg font-bold text-green-500">{getApprovalRate(campaign)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#6c757d]">תקציב</div>
                          <div className="text-lg font-bold text-[#212529]">
                            {campaign.fixed_price ? `₪${campaign.fixed_price}` : 'משתנה'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mr-4">
                      <Link href={`/admin/campaigns/${campaign.id}`}>
                        <Button className="bg-[#f2cc0d] hover:bg-[#d4b00b] text-[#212529] w-full">
                          פרטים
                        </Button>
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <div className="relative group">
                          <Button
                            disabled={processing === campaign.id}
                            className="bg-[#6c757d] hover:bg-[#5a6268] text-white w-full"
                          >
                            שנה סטטוס
                          </Button>
                          <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-white border border-[#dee2e6] rounded-lg shadow-lg z-10 min-w-[120px]">
                            {['draft', 'open', 'closed', 'archived'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleChangeStatus(campaign.id, status as any)}
                                disabled={processing === campaign.id || campaign.status === status}
                                className="block w-full text-right px-4 py-2 text-sm text-[#212529] hover:bg-[#f8f9fa] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {getStatusLabel(status)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Status Breakdown */}
                  {campaign._count.tasks > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#dee2e6]">
                      <div className="text-xs text-[#6c757d] mb-2">סטטוס משימות:</div>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-[#6c757d]">בביצוע: </span>
                          <span className="font-bold text-[#212529]">
                            {campaign._tasks.filter(t => t.status === 'in_production').length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6c757d]">הועלו: </span>
                          <span className="font-bold text-blue-500">
                            {campaign._tasks.filter(t => t.status === 'uploaded').length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6c757d]">טעון תיקון: </span>
                          <span className="font-bold text-yellow-500">
                            {campaign._tasks.filter(t => t.status === 'needs_edits').length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6c757d]">אושרו: </span>
                          <span className="font-bold text-green-500">
                            {campaign._tasks.filter(t => t.status === 'approved').length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6c757d]">שולמו: </span>
                          <span className="font-bold text-[#f2cc0d]">
                            {campaign._tasks.filter(t => t.status === 'paid').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredCampaigns.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-[#6c757d] text-lg">לא נמצאו קמפיינים</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
