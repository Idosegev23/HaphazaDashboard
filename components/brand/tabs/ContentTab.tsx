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
  const [viewingContent, setViewingContent] = useState<{ url: string; type: string } | null>(null);

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
        <div className="text-[#212529] text-xl">טוען תכנים...</div>
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
          <h2 className="text-2xl font-bold text-[#212529]"> תכנים</h2>
          <p className="text-[#6c757d] text-sm">
            {filteredUploads.length} קבצים
            {statusFilter !== 'all' && ` (${statusLabels[statusFilter]})`}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold"
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
                <div
                  className="aspect-video bg-[#f8f9fa] flex items-center justify-center mb-3 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                  onClick={() =>
                    (fileType === 'image' || fileType === 'video') &&
                    setViewingContent({ url: urlData.publicUrl, type: fileType })
                  }
                >
                  {fileType === 'image' ? (
                    <>
                      <img
                        src={urlData.publicUrl}
                        alt="Upload"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors flex items-center justify-center">
                        
                      </div>
                    </>
                  ) : fileType === 'video' ? (
                    <>
                      <video src={urlData.publicUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors flex items-center justify-center pointer-events-none">
                        <span className="text-[#212529] text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
                          ▶️
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Info */}
                <div className="px-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#f8f9fa]">
                      {upload.creator_avatar ? (
                        <img
                          src={upload.creator_avatar}
                          alt={upload.creator_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-[#f2cc0d]">
                          
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#212529] text-sm font-medium truncate">
                        {upload.creator_name}
                      </div>
                      <div className="text-[#6c757d] text-xs truncate">{upload.task_title}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold text-[#212529] ${
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
                       פתח
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-[#6c757d] text-center py-8">
            {uploads.length === 0
              ? 'עדיין לא הועלו תכנים לקמפיין זה'
              : 'לא נמצאו תכנים בסטטוס זה'}
          </p>
        </Card>
      )}

      {/* Full Screen Viewer Modal */}
      {viewingContent && (
        <div
          className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center p-4"
          onClick={() => setViewingContent(null)}
        >
          <button
            onClick={() => setViewingContent(null)}
            className="absolute top-4 right-4 text-[#212529] text-4xl hover:text-[#f2cc0d] transition-colors z-10"
          >
            
          </button>
          
          <div className="max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {viewingContent.type === 'image' ? (
              <img
                src={viewingContent.url}
                alt="Full view"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : viewingContent.type === 'video' ? (
              <video
                src={viewingContent.url}
                controls
                autoPlay
                className="max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[#212529] text-sm bg-white/50 px-4 py-2 rounded-lg">
            לחץ בכל מקום כדי לסגור
          </div>
        </div>
      )}
    </div>
  );
}
