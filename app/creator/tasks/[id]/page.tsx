'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

type Task = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  requires_product: boolean;
  created_at: string;
  campaign_id: string;
  campaigns: {
    id: string;
    title: string;
    brands: {
      name: string;
    } | null;
  } | null;
};

type ShipmentStatus = {
  status: string;
  shipments: Array<{ delivered_at: string | null }>;
};

type Upload = {
  id: string;
  storage_path: string;
  status: string;
  created_at: string;
  meta: any;
};

type RevisionRequest = {
  id: string;
  tags: string[];
  note: string;
  status: string;
  created_at: string;
};

export default function CreatorTaskDetailPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [revisions, setRevisions] = useState<RevisionRequest[]>([]);
  const [shipmentStatus, setShipmentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (user && user.role !== 'creator') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    loadTaskData();
    subscribeToUpdates();
  }, [user?.id, taskId]);

  const loadTaskData = async () => {
    const supabase = createClient();

    // Load task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, status, due_at, requires_product, created_at, campaign_id, campaigns(id, title, brands(name))')
      .eq('id', taskId)
      .eq('creator_id', user!.id)
      .single();

    if (taskError || !taskData) {
      console.error('Error loading task:', taskError);
      setLoading(false);
      return;
    }

    setTask(taskData as Task);

    // Load shipment status if product is required
    if (taskData.requires_product) {
      const { data: shipmentData } = await supabase
        .from('shipment_requests')
        .select('status')
        .eq('campaign_id', taskData.campaign_id)
        .eq('creator_id', user!.id)
        .maybeSingle();

      setShipmentStatus(shipmentData?.status || null);
    }

    // Load uploads
    const { data: uploadsData } = await supabase
      .from('uploads')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (uploadsData) {
      setUploads(uploadsData as Upload[]);
    }

    // Load revision requests
    const { data: revisionsData } = await supabase
      .from('revision_requests')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (revisionsData) {
      setRevisions(revisionsData as RevisionRequest[]);
    }

    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const supabase = createClient();

    // Subscribe to task updates
    const taskChannel = supabase
      .channel(`task-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` }, () => {
        loadTaskData();
      })
      .subscribe();

    // Subscribe to uploads
    const uploadsChannel = supabase
      .channel(`uploads-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploads', filter: `task_id=eq.${taskId}` }, () => {
        loadTaskData();
      })
      .subscribe();

    // Subscribe to revisions
    const revisionsChannel = supabase
      .channel(`revisions-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revision_requests', filter: `task_id=eq.${taskId}` }, () => {
        loadTaskData();
      })
      .subscribe();

    return () => {
      taskChannel.unsubscribe();
      uploadsChannel.unsubscribe();
      revisionsChannel.unsubscribe();
    };
  };

  const handleStartWork = async () => {
    // UX Block: בדוק אם נדרש מוצר ועדיין לא נשלח
    if (task?.requires_product) {
      const supabase = createClient();
      const { data: shipmentData } = await supabase
        .from('shipment_requests')
        .select('status')
        .eq('campaign_id', task.campaigns?.id || '')
        .eq('creator_id', user!.id)
        .single();

      if (!shipmentData || shipmentData.status !== 'delivered') {
        const statusMessage = !shipmentData 
          ? 'המותג עדיין לא יצר בקשת משלוח.' 
          : shipmentData.status === 'not_requested'
          ? 'המותג עדיין לא יצר בקשת משלוח.'
          : shipmentData.status === 'waiting_address'
          ? 'אנא מלא את פרטי הכתובת למשלוח.'
          : shipmentData.status === 'address_received'
          ? 'המותג מכין את המשלוח.'
          : shipmentData.status === 'shipped'
          ? 'המוצר בדרך אליך. המתן למסירה.'
          : shipmentData.status === 'issue'
          ? 'יש בעיה במשלוח. צור קשר עם המותג.'
          : 'המתן לקבלת המשלוח.';
        
        alert(`⏳ לא ניתן להתחיל עבודה לפני שקיבלת את המוצר מהמותג.\n\n${statusMessage}`);
        return;
      }
    }

    if (!confirm('האם אתה מוכן להתחיל לעבוד על המשימה?')) {
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'in_production', updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      // Audit log
      await supabase.rpc('log_audit', {
        p_entity: 'task',
        p_entity_id: taskId,
        p_action: 'work_started',
        p_metadata: {}
      });

      loadTaskData();
    } catch (error: any) {
      alert('שגיאה בעדכון סטטוס: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // UX Block: בדוק שהמשימה בסטטוס נכון להעלאה
    if (task?.status !== 'in_production' && task?.status !== 'needs_edits') {
      alert('לא ניתן להעלות קבצים כרגע.\nיש להתחיל עבודה על המשימה תחילה.');
      event.target.value = ''; // Reset file input
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('הקובץ גדול מדי. גודל מקסימלי: 50MB');
      event.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      alert('סוג קובץ לא נתמך. אנא העלה תמונה או וידאו.');
      event.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const supabase = createClient();

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${taskId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('task-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Create upload record in database
      const { error: dbError } = await supabase
        .from('uploads')
        .insert({
          task_id: taskId,
          storage_path: filePath,
          status: 'pending',
          meta: {
            filename: file.name,
            size: file.size,
            type: file.type,
          },
        });

      if (dbError) {
        throw dbError;
      }

      // Update task status to uploaded if it was in_production
      if (task?.status === 'in_production') {
        await supabase
          .from('tasks')
          .update({ status: 'uploaded', updated_at: new Date().toISOString() })
          .eq('id', taskId);
      }

      // If task was needs_edits, keep it as needs_edits but mark revision as resolved
      if (task?.status === 'needs_edits') {
        await supabase
          .from('revision_requests')
          .update({ status: 'resolved' })
          .eq('task_id', taskId)
          .eq('status', 'open');
      }

      alert('הקובץ הועלה בהצלחה!');
      loadTaskData();
      
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('שגיאה בהעלאת הקובץ: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">משימה לא נמצאה</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    selected: 'נבחרת למשימה',
    in_production: 'בעבודה',
    uploaded: 'הועלה תוכן',
    needs_edits: 'דרוש תיקון',
    approved: 'אושר',
    paid: 'שולם',
  };

  const statusColors: Record<string, string> = {
    selected: 'bg-blue-500',
    in_production: 'bg-yellow-500',
    uploaded: 'bg-purple-500',
    needs_edits: 'bg-orange-500',
    approved: 'bg-green-500',
    paid: 'bg-green-700',
  };

  const canStartWork = task.status === 'selected' && (!task.requires_product || shipmentStatus === 'delivered');
  const canUpload = task.status === 'in_production' || task.status === 'needs_edits';
  const isBlocked = task.requires_product && task.status === 'selected' && shipmentStatus !== 'delivered';
  
  const getShipmentStatusMessage = () => {
    if (!shipmentStatus) return 'המותג עדיין לא יצר בקשת משלוח.';
    switch (shipmentStatus) {
      case 'not_requested':
        return 'המותג עדיין לא יצר בקשת משלוח.';
      case 'waiting_address':
        return 'אנא מלא את פרטי הכתובת למשלוח בדף המשלוחים.';
      case 'address_received':
        return 'המותג מכין את המשלוח.';
      case 'shipped':
        return 'המוצר בדרך אליך. המתן למסירה.';
      case 'issue':
        return 'יש בעיה במשלוח. צור קשר עם המותג.';
      default:
        return 'המתן לקבלת המשלוח.';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/creator/tasks')}
                className="text-[#cbc190] hover:text-[#f2cc0d] transition-colors"
              >
                ← חזרה למשימות
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{task.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
              {task.campaigns && (
                <span className="text-[#cbc190] text-sm">
                  {task.campaigns.title} • {task.campaigns.brands?.name}
                </span>
              )}
            </div>
          </div>
          {canStartWork && (
            <Button
              onClick={handleStartWork}
              disabled={processing}
              className="bg-[#f2cc0d] text-black hover:bg-[#d4b50c]"
            >
              {processing ? 'מעבד...' : 'התחל עבודה'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Blocked by shipment */}
          {isBlocked && (
            <Card className="border-2 border-orange-500 bg-orange-500/10">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📦</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">⏳ ממתין לקבלת מוצר</h3>
                  <p className="text-[#cbc190] mb-2">
                    משימה זו דורשת קבלת מוצר פיזי מהמותג לפני שתוכל להתחיל לעבוד.
                  </p>
                  <div className="bg-[#2e2a1b] rounded-lg p-3 mb-3 border border-[#494222]">
                    <div className="text-sm text-[#cbc190]">סטטוס משלוח:</div>
                    <div className="text-white font-medium">{getShipmentStatusMessage()}</div>
                  </div>
                  <Button
                    onClick={() => router.push('/creator/shipping')}
                    className="bg-[#f2cc0d] text-black hover:bg-[#d4b50c]"
                  >
                    עבור לדף משלוחים
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Task Details */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">פרטי המשימה</h2>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#cbc190] text-sm">קמפיין</span>
                  <div className="text-white font-medium">{task.campaigns?.title}</div>
                </div>
                <div>
                  <span className="text-[#cbc190] text-sm">מותג</span>
                  <div className="text-white font-medium">{task.campaigns?.brands?.name}</div>
                </div>
              </div>
              {task.due_at && (
                <div>
                  <span className="text-[#cbc190] text-sm">תאריך יעד</span>
                  <div className="text-white font-medium">
                    {new Date(task.due_at).toLocaleDateString('he-IL')}
                  </div>
                </div>
              )}
              <div>
                <span className="text-[#cbc190] text-sm">דרוש מוצר פיזי</span>
                <div className="text-white font-medium">
                  {task.requires_product ? '✅ כן' : '❌ לא'}
                </div>
              </div>
            </div>
          </Card>

          {/* Active Revision Requests */}
          {revisions.filter(r => r.status === 'open').length > 0 && (
            <Card className="border-2 border-orange-500">
              <h2 className="text-xl font-bold text-white mb-4">🔄 בקשות תיקון</h2>
              <div className="space-y-4">
                {revisions.filter(r => r.status === 'open').map((revision) => (
                  <div key={revision.id} className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {revision.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-white mb-2">{revision.note}</p>
                    <span className="text-xs text-[#cbc190]">
                      {new Date(revision.created_at).toLocaleDateString('he-IL')} {new Date(revision.created_at).toLocaleTimeString('he-IL')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Upload Section */}
          {canUpload && (
            <Card>
              <h2 className="text-xl font-bold text-white mb-4">העלאת תוכן</h2>
              <div className="bg-[#2e2a1b] rounded-lg p-8 border-2 border-dashed border-[#494222]">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">📤</div>
                  <p className="text-[#cbc190] mb-4">
                    העלה תמונות או סרטונים של התוכן שיצרת
                  </p>
                  <p className="text-sm text-[#cbc190] mb-4">
                    קבצים נתמכים: JPG, PNG, GIF, WebP, MP4, MOV, AVI (עד 50MB)
                  </p>
                </div>
                <div className="flex justify-center">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    id="file-upload"
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className={cn(
                      'inline-block font-bold rounded-lg transition-all px-6 py-3 text-base',
                      uploading ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-[#f2cc0d] text-black hover:bg-[#d4b50c]'
                    )}>
                      {uploading ? `מעלה... ${uploadProgress}%` : 'בחר קובץ להעלאה'}
                    </span>
                  </label>
                </div>
                {uploading && (
                  <div className="mt-4">
                    <div className="w-full bg-[#1E1E1E] rounded-full h-2">
                      <div
                        className="bg-[#f2cc0d] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Uploads History */}
          {uploads.length > 0 && (
            <Card>
              <h2 className="text-xl font-bold text-white mb-4">היסטוריית העלאות</h2>
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div key={upload.id} className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{upload.storage_path.split('/').pop()}</div>
                        <span className="text-xs text-[#cbc190]">
                          {new Date(upload.created_at).toLocaleDateString('he-IL')} {new Date(upload.created_at).toLocaleTimeString('he-IL')}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        upload.status === 'approved' ? 'bg-green-500 text-white' :
                        upload.status === 'rejected' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
