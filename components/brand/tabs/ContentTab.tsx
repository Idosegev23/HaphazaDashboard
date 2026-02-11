'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';

type ContentTabProps = {
  campaignId: string;
};

type Upload = {
  id: string;
  storage_path: string;
  status: string;
  created_at: string;
  meta: any;
  task_id: string;
  creator_name: string;
  creator_avatar: string | null;
  task_title: string;
};

export function ContentTab({ campaignId }: ContentTabProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadContent();
  }, [campaignId]);

  const loadContent = async () => {
    const supabase = createClient();

    // Get tasks for this campaign
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, title, creator_id')
      .eq('campaign_id', campaignId);

    if (!tasksData || tasksData.length === 0) {
      setLoading(false);
      return;
    }

    const taskIds = tasksData.map((t) => t.id);

    // Get uploads for these tasks
    const { data: uploadsData, error } = await supabase
      .from('uploads')
      .select('*')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading content:', error);
      setLoading(false);
      return;
    }

    // Enrich with creator and task data
    const enriched = await Promise.all(
      (uploadsData || []).map(async (upload: any) => {
        const task = tasksData.find((t) => t.id === upload.task_id);
        const { data: profileData } = await supabase
          .from('users_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', task?.creator_id || '')
          .single();

        return {
          ...upload,
          task_title: task?.title || 'לא זמין',
          creator_name: profileData?.display_name || 'לא זמין',
          creator_avatar: profileData?.avatar_url || null,
        };
      })
    );

    setUploads(enriched);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-xl">טוען תכנים...</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: 'ממתין לבדיקה',
    approved: 'אושר',
    rejected: 'נדחה',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  const filteredUploads =
    statusFilter === 'all' ? uploads : uploads.filter((u) => u.status === statusFilter);

  const getFileType = (path: string) => {
    if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (path.match(/\.(mp4|mov|avi|wmv)$/i)) return 'video';
    return 'file';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📤 תכנים</h2>
          <p className="text-[#cbc190] text-sm">
            {filteredUploads.length} קבצים
            {statusFilter !== 'all' && ` (${statusLabels[statusFilter]})`}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#2e2a1b] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="pending">ממתין ({uploads.filter((u) => u.status === 'pending').length})</option>
          <option value="approved">אושר ({uploads.filter((u) => u.status === 'approved').length})</option>
          <option value="rejected">נדחה ({uploads.filter((u) => u.status === 'rejected').length})</option>
        </select>
      </div>

      {/* Content Grid */}
      {filteredUploads.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUploads.map((upload) => {
            const fileType = getFileType(upload.storage_path);
            const supabase = createClient();
            const { data: urlData } = supabase.storage
              .from('task-uploads')
              .getPublicUrl(upload.storage_path);

            return (
              <Card key={upload.id} className="relative overflow-hidden">
                <div className={`status-stripe ${statusColors[upload.status || 'pending']}`} />
                
                {/* File Preview */}
                <div className="aspect-video bg-[#2e2a1b] flex items-center justify-center mb-3 rounded-lg overflow-hidden">
                  {fileType === 'image' ? (
                    <img
                      src={urlData.publicUrl}
                      alt="Upload"
                      className="w-full h-full object-cover"
                    />
                  ) : fileType === 'video' ? (
                    <video src={urlData.publicUrl} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="text-4xl">📄</div>
                  )}
                </div>

                {/* Info */}
                <div className="px-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2e2a1b]">
                      {upload.creator_avatar ? (
                        <img
                          src={upload.creator_avatar}
                          alt={upload.creator_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-[#f2cc0d]">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {upload.creator_name}
                      </div>
                      <div className="text-[#cbc190] text-xs truncate">{upload.task_title}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold text-white ${
                        statusColors[upload.status || 'pending']
                      }`}
                    >
                      {statusLabels[upload.status || 'pending']}
                    </span>
                    <a
                      href={urlData.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f2cc0d] hover:text-[#d4b00b] text-xs"
                    >
                      🔗 פתח
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-[#cbc190] text-center py-8">
            {uploads.length === 0
              ? 'עדיין לא הועלו תכנים לקמפיין זה'
              : 'לא נמצאו תכנים בסטטוס זה'}
          </p>
        </Card>
      )}
    </div>
  );
}
