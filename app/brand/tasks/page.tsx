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
  campaigns: {
    title: string;
  } | null;
};

export default function BrandTasksPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | 'all'>('all');

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
        .select('*, campaigns!inner(brand_id, title), creators(niches)')
        .eq('campaigns.brand_id', user.brand_id!)
        .order('created_at', { ascending: false });
      
      if (data) {
        setTasks(data as Task[]);
      }
    };

    fetchTasks();
  }, [user?.brand_id]);

  // Group by status
  const tasksByStatus = {
    selected: tasks.filter((t) => t.status === 'selected'),
    in_production: tasks.filter((t) => t.status === 'in_production'),
    uploaded: tasks.filter((t) => t.status === 'uploaded'),
    needs_edits: tasks.filter((t) => t.status === 'needs_edits'),
    approved: tasks.filter((t) => t.status === 'approved'),
    paid: tasks.filter((t) => t.status === 'paid'),
  };

  const statusLabels: Record<string, string> = {
    selected: 'נבחר',
    in_production: 'בייצור',
    uploaded: 'הועלה - סקירה',
    needs_edits: 'דרוש עריכה',
    approved: 'אושר',
    paid: 'שולם',
  };

  const statusColors: Record<string, string> = {
    selected: 'bg-blue-500',
    in_production: 'bg-yellow-500',
    uploaded: 'bg-purple-500',
    needs_edits: 'bg-red-500',
    approved: 'bg-green-500',
    paid: 'bg-[#f2cc0d]',
  };

  const filteredTasks = selectedFilter === 'all' ? tasks : tasksByStatus[selectedFilter as keyof typeof tasksByStatus];

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">🎬 ניהול תוכן</h1>
        <p className="text-[#cbc190]">מעקב, בקשת תיקונים ואישור תוכן מהמשפיענים</p>
      </div>

      {/* Mobile Filter - Show only on mobile */}
      <div className="lg:hidden px-4 py-4 border-b border-[#494222] overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedFilter === 'all'
                ? 'bg-[#f2cc0d] text-[#121212]'
                : 'bg-[#2e2a1b] text-[#cbc190] hover:bg-[#3a3525]'
            }`}
          >
            הכל ({tasks.length})
          </button>
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <button
              key={status}
              onClick={() => setSelectedFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedFilter === status
                  ? 'bg-[#f2cc0d] text-[#121212]'
                  : 'bg-[#2e2a1b] text-[#cbc190] hover:bg-[#3a3525]'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
              {statusLabels[status]} ({statusTasks.length})
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Kanban Board - Hidden on mobile */}
      <div className="hidden lg:block flex-1 overflow-x-auto px-4 py-6 lg:px-8">
        <div className="flex gap-4 h-full min-w-max">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col">
              {/* Column Header */}
              <div className="mb-4 pb-3 border-b border-[#494222]">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                  <h3 className="text-white font-bold text-lg">{statusLabels[status]}</h3>
                  <span className="text-[#cbc190] text-sm">({statusTasks.length})</span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {statusTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    hover 
                    className="relative cursor-pointer"
                    onClick={() => router.push(`/brand/tasks/${task.id}`)}
                  >
                    <div className={`absolute top-0 right-0 w-1 h-full ${statusColors[status]}`} />
                    <div className="pr-4">
                      <h4 className="text-white font-medium mb-2">{task.title}</h4>
                      <div className="text-sm text-[#cbc190] mb-2">
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
                  <div className="text-[#cbc190] text-sm text-center py-8 opacity-50">
                    אין משימות
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile List View */}
      <div className="lg:hidden flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[#cbc190] text-lg mb-2">אין משימות</div>
              <div className="text-[#cbc190] text-sm opacity-70">
                {selectedFilter === 'all' ? 'אין משימות כרגע' : `אין משימות בסטטוס "${statusLabels[selectedFilter]}"`}
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <Card 
                key={task.id} 
                hover 
                className="relative cursor-pointer"
                onClick={() => router.push(`/brand/tasks/${task.id}`)}
              >
                <div className={`absolute top-0 right-0 w-1 h-full ${statusColors[task.status]}`} />
                <div className="pr-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${statusColors[task.status]}`} />
                    <span className="text-xs text-[#cbc190] font-medium">
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  
                  <h4 className="text-white font-medium mb-2 text-lg">{task.title}</h4>
                  <div className="text-sm text-[#cbc190] mb-2">
                    {task.campaigns?.title}
                  </div>
                  {task.due_at && (
                    <div className="text-xs text-[#f2cc0d] mt-3 flex items-center gap-1">
                      <span>📅</span>
                      <span>יעד: {new Date(task.due_at).toLocaleDateString('he-IL')}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
