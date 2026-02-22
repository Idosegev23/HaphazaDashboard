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
  rejection_reason: string | null;
  rejection_notes: string | null;
};

const REJECTION_REASONS = [
  { value: 'not_matching_brief', label: 'לא תואם את הבריף' },
  { value: 'low_quality', label: 'איכות נמוכה (תמונה/וידאו)' },
  { value: 'text_errors', label: 'טעויות בטקסט / כיתוב' },
  { value: 'wrong_format', label: 'פורמט לא נכון (אורך/גודל)' },
  { value: 'missing_elements', label: 'חסרים אלמנטים נדרשים' },
  { value: 'branding_issues', label: 'בעיות במיתוג / לוגו' },
  { value: 'tone_mismatch', label: 'טון לא מתאים למותג' },
  { value: 'other', label: 'אחר' },
];

export function ContentTab({ campaignId }: ContentTabProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingContent, setViewingContent] = useState<{ url: string; type: string } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [maxRevisions, setMaxRevisions] = useState<number>(2);
  const [taskRejectionCounts, setTaskRejectionCounts] = useState<Record<string, number>>({});

  // Rejection modal state
  const [rejectingUploadId, setRejectingUploadId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('not_matching_brief');
  const [rejectionNotes, setRejectionNotes] = useState('');

  useEffect(() => {
    loadContent();
  }, [campaignId]);

  const loadContent = async () => {
    const supabase = createClient();

    // Fetch campaign max_revisions
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('max_revisions')
      .eq('id', campaignId)
      .single();
    if (campaignData) {
      setMaxRevisions((campaignData as any).max_revisions ?? 2);
    }

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

    // Compute rejection counts per task
    const rejCounts: Record<string, number> = {};
    for (const u of enriched) {
      if (u.status === 'rejected') {
        rejCounts[u.task_id] = (rejCounts[u.task_id] || 0) + 1;
      }
    }
    setTaskRejectionCounts(rejCounts);

    setUploads(enriched);
    setLoading(false);
  };

  const handleApprove = async (uploadId: string) => {
    if (!confirm('האם לאשר את התוכן הזה?')) return;

    setProcessing(uploadId);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('review_content' as any, {
        p_upload_id: uploadId,
        p_action: 'approve',
      });

      if (error) throw error;
      const result = data as any;
      if (result && !result.success) throw new Error(result.error);

      alert('✅ התוכן אושר בהצלחה!');
      loadContent();
    } catch (error: any) {
      console.error('Error approving:', error);
      alert('שגיאה באישור: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (uploadId: string) => {
    setRejectingUploadId(uploadId);
    setRejectionReason('not_matching_brief');
    setRejectionNotes('');
  };

  const handleReject = async () => {
    if (!rejectingUploadId) return;

    const reasonLabel = REJECTION_REASONS.find(r => r.value === rejectionReason)?.label || rejectionReason;
    const feedback = rejectionNotes
      ? `${reasonLabel}: ${rejectionNotes}`
      : reasonLabel;

    setProcessing(rejectingUploadId);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('review_content' as any, {
        p_upload_id: rejectingUploadId,
        p_action: 'reject',
        p_feedback: feedback,
      });

      if (error) throw error;
      const result = data as any;
      if (result && !result.success) throw new Error(result.error);

      // Save structured rejection data to dedicated columns
      await supabase
        .from('uploads')
        .update({
          rejection_reason: rejectionReason,
          rejection_notes: rejectionNotes || null,
        } as any)
        .eq('id', rejectingUploadId);

      setRejectingUploadId(null);
      loadContent();
    } catch (error: any) {
      console.error('Error rejecting:', error);
      alert('שגיאה בדחייה: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

                  <div className="mt-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold text-[#212529] ${
                        statusColors[upload.status || 'pending']
                      } mb-3`}
                    >
                      {statusLabels[upload.status || 'pending']}
                    </span>

                    {/* Rejection info */}
                    {upload.status === 'rejected' && upload.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2 text-xs">
                        <div className="font-medium text-red-700">
                          {REJECTION_REASONS.find(r => r.value === upload.rejection_reason)?.label || upload.rejection_reason}
                        </div>
                        {upload.rejection_notes && (
                          <p className="text-red-600 mt-0.5 line-clamp-2">{upload.rejection_notes}</p>
                        )}
                      </div>
                    )}

                    {/* Revision count badge */}
                    {taskRejectionCounts[upload.task_id] > 0 && (
                      <div className="text-xs text-[#6c757d] mb-1">
                        סבב {(taskRejectionCounts[upload.task_id] || 0) + 1} מתוך {maxRevisions}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-2">
                      {upload.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(upload.id)}
                            disabled={processing === upload.id}
                            className="w-full px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            {processing === upload.id ? '...' : '✅ אשר'}
                          </button>
                          {(taskRejectionCounts[upload.task_id] || 0) >= maxRevisions ? (
                            <div className="w-full px-3 py-2 bg-[#f8f9fa] text-[#6c757d] text-sm text-center rounded-lg border border-[#dee2e6]">
                              הגעת למקסימום תיקונים ({maxRevisions})
                            </div>
                          ) : (
                          <button
                            onClick={() => openRejectModal(upload.id)}
                            disabled={processing === upload.id}
                            className="w-full px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            {processing === upload.id ? '...' : '❌ דחה'}
                          </button>
                          )}
                        </>
                      )}
                      
                      <div className="flex gap-2">
                        <a
                          href={urlData.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 bg-[#f8f9fa] text-[#212529] text-sm font-medium rounded-lg hover:bg-[#e9ecef] transition-colors text-center border border-[#dee2e6]"
                        >
                          👁️ צפה
                        </a>
                        <button
                          onClick={() => handleDownload(urlData.publicUrl, upload.meta?.filename || `file_${upload.id}`)}
                          className="flex-1 px-3 py-2 bg-[#f2cc0d] text-black text-sm font-medium rounded-lg hover:bg-[#d4b00b] transition-colors"
                        >
                          ⬇️ הורד
                        </button>
                      </div>
                    </div>
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

      {/* Rejection Reason Modal */}
      {rejectingUploadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRejectingUploadId(null)}
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#212529]">דחיית תוכן</h3>

            <div>
              <label className="block text-sm font-medium text-[#6c757d] mb-1.5">סיבת הדחייה</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-[#f2cc0d]"
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6c757d] mb-1.5">הערות למשפיען</label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="פרט מה צריך לתקן..."
                rows={3}
                className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-[#f2cc0d] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReject}
                disabled={processing === rejectingUploadId}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {processing === rejectingUploadId ? 'שולח...' : 'דחה תוכן'}
              </button>
              <button
                onClick={() => setRejectingUploadId(null)}
                className="px-4 py-2.5 bg-[#f8f9fa] text-[#6c757d] rounded-lg font-medium hover:bg-[#e9ecef] transition-colors border border-[#dee2e6]"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
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
