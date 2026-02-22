'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

type Task = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  campaign_id: string;
  campaigns: {
    id: string;
    title: string;
  } | null;
};

export default function BrandTasksPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({});
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.brand_id) return;

    const supabase = createClient();
    
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, campaigns!inner(id, brand_id, title), creators(niches)')
        .eq('campaigns.brand_id', user.brand_id!)
        .order('created_at', { ascending: false });
      
      if (data) {
        setTasks(data as Task[]);
      }
    };

    const fetchCampaigns = async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('id, title')
        .eq('brand_id', user.brand_id!)
        .order('created_at', { ascending: false});
      
      setCampaigns(data || []);
    };

    fetchTasks();
    fetchCampaigns();
  }, [user?.brand_id]);

  // Group by status
  const tasksByStatus = {
    selected: tasks.filter((t) => t.status === 'selected'),
    in_production: tasks.filter((t) => t.status === 'in_production'),
    uploaded: tasks.filter((t) => t.status === 'uploaded'),
    needs_edits: tasks.filter((t) => t.status === 'needs_edits'),
    approved: tasks.filter((t) => t.status === 'approved'),
    paid: tasks.filter((t) => t.status === 'paid'),
    disputed: tasks.filter((t) => t.status === 'disputed'),
  };

  const statusLabels: Record<string, string> = {
    selected: 'נבחר',
    in_production: 'בייצור',
    uploaded: 'הועלה - סקירה',
    needs_edits: 'דרוש עריכה',
    approved: 'אושר',
    paid: 'שולם',
    disputed: 'במחלוקת',
  };

  const statusColors: Record<string, string> = {
    selected: 'bg-blue-500',
    in_production: 'bg-yellow-500',
    uploaded: 'bg-purple-500',
    needs_edits: 'bg-red-500',
    approved: 'bg-green-500',
    paid: 'bg-[#f2cc0d]',
    disputed: 'bg-red-600',
  };

  // Filter by campaign for accordion
  const getFilteredStatusTasks = (statusTasks: Task[]) => {
    if (selectedCampaign === 'all') return statusTasks;
    return statusTasks.filter(task => task.campaign_id === selectedCampaign);
  };

  // Auto-expand statuses that have tasks (on first load)
  useEffect(() => {
    if (tasks.length > 0 && Object.keys(expandedStatuses).length === 0) {
      const initial: Record<string, boolean> = {};
      Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
        initial[status] = statusTasks.length > 0;
      });
      setExpandedStatuses(initial);
    }
  }, [tasks]);

  const toggleStatus = (status: string) => {
    setExpandedStatuses(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const isOverdue = (dueAt: string) => new Date(dueAt) < new Date();

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mb-2">🎬 ניהול תוכן</h1>
            <p className="text-[#6c757d]">מעקב, בקשת תיקונים ואישור תוכן מהמשפיענים</p>
          </div>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-4 py-2 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold"
          >
            <option value="all">כל הקמפיינים</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Kanban Board - Hidden on mobile */}
      <div className="hidden lg:block flex-1 overflow-x-auto px-4 py-6 lg:px-8">
        <div className="flex gap-4 h-full min-w-max">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const columnTasks = selectedCampaign === 'all' 
              ? statusTasks 
              : statusTasks.filter(task => task.campaign_id === selectedCampaign);
            return (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col">
              {/* Column Header */}
              <div className="mb-4 pb-3 border-b border-[#dee2e6]">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                  <h3 className="text-[#212529] font-bold text-lg">{statusLabels[status]}</h3>
                  <span className="text-[#6c757d] text-sm">({columnTasks.length})</span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {columnTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    hover 
                    className="relative cursor-pointer"
                    onClick={() => router.push(`/brand/tasks/${task.id}`)}
                  >
                    <div className={`absolute top-0 right-0 w-1 h-full ${statusColors[status]}`} />
                    <div className="pr-4">
                      <h4 className="text-[#212529] font-medium mb-2">{task.title}</h4>
                      <div className="text-sm text-[#6c757d] mb-2">
                        {task.campaigns?.title}
                      </div>
                      {task.due_at && (
                        <div className="text-xs text-[#f2cc0d] mt-2 flex items-center gap-1">
                          <span>📅</span>
                          <span>יעד: {new Date(task.due_at).toLocaleDateString('he-IL')}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {statusTasks.length === 0 && (
                  <div className="text-[#6c757d] text-sm text-center py-8 opacity-50">
                    אין משימות
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Accordion View */}
      <div className="lg:hidden flex-1 overflow-y-auto px-4 py-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[#6c757d] text-lg mb-2">אין משימות</div>
            <div className="text-[#6c757d] text-sm opacity-70">אין משימות כרגע</div>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
              const filteredStatusTasks = getFilteredStatusTasks(statusTasks);
              const hasItems = filteredStatusTasks.length > 0;
              const isExpanded = expandedStatuses[status];

              return (
                <div key={status} className="rounded-xl border border-[#dee2e6] overflow-hidden bg-white">
                  {/* Accordion Header */}
                  <button
                    onClick={() => hasItems && toggleStatus(status)}
                    className={`w-full flex items-center justify-between px-4 py-3 ${
                      hasItems ? 'cursor-pointer active:bg-[#f1f3f5]' : 'cursor-default opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                      <span className="text-[#212529] font-bold text-sm">{statusLabels[status]}</span>
                      <span className="text-[#6c757d] text-xs">({filteredStatusTasks.length})</span>
                    </div>
                    {hasItems && (
                      <svg
                        className={`w-4 h-4 text-[#6c757d] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && hasItems && (
                    <div className="border-t border-[#dee2e6]">
                      {filteredStatusTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          onClick={() => router.push(`/brand/tasks/${task.id}`)}
                          className={`relative flex items-center px-4 py-3 cursor-pointer active:bg-[#f8f9fa] ${
                            idx < filteredStatusTasks.length - 1 ? 'border-b border-[#f1f3f5]' : ''
                          }`}
                        >
                          <div className={`absolute top-0 right-0 w-1 h-full ${statusColors[status]}`} />
                          <div className="flex-1 pr-3 min-w-0">
                            <h4 className="text-[#212529] font-medium text-sm truncate">{task.title}</h4>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6c757d]">
                              <span className="truncate">{task.campaigns?.title}</span>
                            </div>
                          </div>
                          {task.due_at && (
                            <div className={`flex-shrink-0 text-xs font-medium flex items-center gap-1 ${
                              isOverdue(task.due_at) ? 'text-red-500' : 'text-[#f2cc0d]'
                            }`}>
                              <span>{new Date(task.due_at).toLocaleDateString('he-IL')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
