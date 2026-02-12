'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

type Task = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  requires_product: boolean;
  created_at: string;
  campaign_id: string;
  product_requirements: string | null;
  campaigns: {
    id: string;
    title: string;
    description: string | null;
    brief: string | null;
    brief_url: string | null;
    deliverables: any; // JSONB
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
  const [selectedDeliverableType, setSelectedDeliverableType] = useState<string>('');

  const DELIVERABLE_LABELS: Record<string, string> = {
    instagram_story: 'Instagram Story',
    instagram_reel: 'Instagram Reel',
    instagram_post: 'Instagram Post',
    tiktok_video: 'TikTok Video',
    ugc_video: 'UGC Video',
    photo: 'Photo (תמונה)',
  };

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
      .select('id, title, status, due_at, requires_product, created_at, campaign_id, product_requirements, campaigns(id, title, description, brief, brief_url, deliverables, brands(name))')
      .eq('id', taskId)
      .eq('creator_id', user!.id)
      .single();

    if (taskError || !taskData) {
      console.error('Error loading task:', taskError);
      setLoading(false);
      return;
    }

    setTask(taskData as unknown as Task);

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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // UX Block: בדוק שהמשימה בסטטוס נכון להעלאה
    if (task?.status !== 'in_production' && task?.status !== 'needs_edits') {
      alert('לא ניתן להעלות קבצים כרגע.\nיש להתחיל עבודה על המשימה תחילה.');
      event.target.value = '';
      return;
    }

    // UX Block: בדוק אם נדרש מוצר פיזי ועדיין לא התקבל
    if (task?.requires_product) {
      const supabase = createClient();
      const { data: shipmentData } = await supabase
        .from('shipment_requests')
        .select('status')
        .eq('campaign_id', task.campaigns?.id || '')
        .eq('creator_id', user!.id)
        .single();

      if (!shipmentData || shipmentData.status !== 'delivered') {
        alert('⏳ לא ניתן להעלות קבצים לפני קבלת המוצר מהמותג.\n\nאנא המתן לקבלת המשלוח או עבור לדף המשלוחים למעקב.');
        event.target.value = '';
        return;
      }
    }

    // Validate deliverable type selection if deliverables are defined
    if (task?.campaigns?.deliverables && Object.keys(task.campaigns.deliverables).length > 0 && !selectedDeliverableType) {
      alert('אנא בחר את סוג התוכן שאתה מעלה (למשל: Story, Reel, וכו\')');
      event.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const supabase = createClient();

    try {
      const wasNeedingEdits = task?.status === 'needs_edits';
      let successCount = 0;
      let errorCount = 0;

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
          console.error(`File ${file.name} too large`);
          errorCount++;
          continue;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedTypes.includes(file.type)) {
          console.error(`File ${file.name} unsupported type`);
          errorCount++;
          continue;
        }

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

          if (uploadError) throw uploadError;

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
                deliverable_type: selectedDeliverableType || null,
              },
            });

          if (dbError) throw dbError;

          successCount++;
        } catch (fileError: any) {
          console.error(`Error uploading ${file.name}:`, fileError);
          errorCount++;
        }
      }

      // Update task status to uploaded if it was in_production OR needs_edits
      if (successCount > 0 && (task?.status === 'in_production' || task?.status === 'needs_edits')) {
        await supabase
          .from('tasks')
          .update({ status: 'uploaded', updated_at: new Date().toISOString() })
          .eq('id', taskId);
      }

      // Show appropriate message
      if (successCount > 0) {
        if (wasNeedingEdits) {
          alert(` ${successCount} קבצים הועלו בהצלחה!\n\nהמשימה חזרה לסטטוס "הועלה" והמותג יקבל התראה לבדוק מחדש.${errorCount > 0 ? `\n\n️ ${errorCount} קבצים נכשלו.` : ''}\n\nמה הלאה?\n• המותג יסקור את התוכן המעודכן\n• תקבל/י התראה כשהתוכן יאושר או יידרש תיקון נוסף\n• ניתן לראות את סטטוס המשימה בלוח המשימות`);
        } else {
          alert(` ${successCount} קבצים הועלו בהצלחה!${errorCount > 0 ? `\n\n️ ${errorCount} קבצים נכשלו.` : ''}\n\nמה הלאה?\n• המותג יסקור את התוכן שלך\n• תקבל/י התראה כשהתוכן יאושר או יידרש תיקון\n• ניתן לראות את סטטוס המשימה בלוח המשימות`);
        }
        
        // Offer to return to tasks page
        if (confirm('האם תרצה/י לחזור ללוח המשימות?')) {
          router.push('/creator/tasks');
          return;
        }
      } else {
        alert(' לא הצלחנו להעלות אף קובץ. בדוק את הגודל והסוג.');
      }
      
      loadTaskData();
      
      // Reset file input and selection
      event.target.value = '';
      setSelectedDeliverableType('');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('שגיאה בהעלאת הקבצים: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">משימה לא נמצאה</div>
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

  const getUploadedCount = (type: string) => {
    return uploads.filter(u => u.meta?.deliverable_type === type).length;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/creator/tasks')}
                className="text-[#6c757d] hover:text-[#f2cc0d] transition-colors"
              >
                ← חזרה למשימות
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#212529]">{task.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-[#212529] ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
              {task.campaigns && (
                <span className="text-[#6c757d] text-sm">
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
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#212529] mb-2">⏳ ממתין לקבלת מוצר</h3>
                  <p className="text-[#6c757d] mb-2">
                    משימה זו דורשת קבלת מוצר פיזי מהמותג לפני שתוכל להתחיל לעבוד.
                  </p>
                  <div className="bg-[#f8f9fa] rounded-lg p-3 mb-3 border border-[#dee2e6]">
                    <div className="text-sm text-[#6c757d]">סטטוס משלוח:</div>
                    <div className="text-[#212529] font-medium">{getShipmentStatusMessage()}</div>
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

          {/* Campaign Brief */}
          {(task.campaigns?.brief || task.campaigns?.description) && (
            <Card className="bg-gradient-to-br from-[#2e2a1b] to-[#1E1E1E] border-2 border-[#f2cc0d]">
              <h2 className="text-xl font-bold text-[#212529] mb-3 flex items-center gap-2">
                 בריף הקמפיין
              </h2>
              <div className="prose prose-invert max-w-none">
                {task.campaigns.brief ? (
                  <p className="text-[#212529] text-base leading-relaxed whitespace-pre-wrap">
                    {task.campaigns.brief}
                  </p>
                ) : (
                  <p className="text-[#212529] text-base leading-relaxed whitespace-pre-wrap">
                    {task.campaigns.description}
                  </p>
                )}
              </div>
              {task.campaigns.brief_url && (
                <div className="mt-4 pt-4 border-t border-[#dee2e6]">
                  <a 
                    href={task.campaigns.brief_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#f2cc0d] text-black font-medium rounded-lg hover:bg-[#d4b00b] transition-colors"
                  >
                    <span className="material-symbols-outlined">download</span>
                    הורד בריף מצורף
                  </a>
                </div>
              )}
            </Card>
          )}

          {/* Product Requirements */}
          {task.requires_product && (
            <Card className="border-2 border-orange-500 bg-orange-500/5">
              <h2 className="text-xl font-bold text-[#212529] mb-3 flex items-center gap-2">
                 דרישות מוצר
              </h2>
              <div className="space-y-3">
                <div className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                  <div className="flex items-start gap-3">
                    
                    <div className="flex-1">
                      <h3 className="text-[#212529] font-bold mb-1">מוצר פיזי נדרש</h3>
                      <p className="text-[#6c757d] text-sm mb-2">
                        משימה זו דורשת קבלת מוצר פיזי מהמותג לפני התחלת העבודה
                      </p>
                      {task.product_requirements && (
                        <div className="bg-white rounded-lg p-3 mt-2 border border-[#dee2e6]">
                          <p className="text-[#212529] text-sm whitespace-pre-wrap">
                            {task.product_requirements}
                          </p>
                        </div>
                      )}
                      {shipmentStatus && (
                        <div className="mt-3 text-sm">
                          <span className="text-[#6c757d]">סטטוס משלוח: </span>
                          <span className={`font-medium ${
                            shipmentStatus === 'delivered' ? 'text-green-400' :
                            shipmentStatus === 'shipped' ? 'text-blue-400' :
                            shipmentStatus === 'issue' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {getShipmentStatusMessage()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Task Details */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4">פרטי המשימה</h2>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#6c757d] text-sm">קמפיין</span>
                  <div className="text-[#212529] font-medium">{task.campaigns?.title}</div>
                </div>
                <div>
                  <span className="text-[#6c757d] text-sm">מותג</span>
                  <div className="text-[#212529] font-medium">{task.campaigns?.brands?.name}</div>
                </div>
              </div>
              {task.due_at && (
                <div>
                  <span className="text-[#6c757d] text-sm">תאריך יעד</span>
                  <div className="text-[#212529] font-medium">
                    {new Date(task.due_at).toLocaleDateString('he-IL')}
                  </div>
                </div>
              )}
            </div>

            {/* Deliverables Display */}
            {task.campaigns?.deliverables && Object.keys(task.campaigns.deliverables).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#dee2e6]">
                <h3 className="text-sm font-medium text-[#6c757d] mb-3">תוצרים נדרשים</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(task.campaigns.deliverables).map(([key, value]) => {
                    if (!value || (value as number) === 0) return null;
                    const labels: Record<string, string> = {
                      instagram_story: 'Instagram Story',
                      instagram_reel: 'Instagram Reel',
                      instagram_post: 'Instagram Post',
                      tiktok_video: 'TikTok Video',
                      ugc_video: 'UGC Video',
                      photo: 'Photo (תמונה)',
                    };
                    return (
                      <span key={key} className="px-3 py-1 bg-[#f8f9fa] border border-[#f2cc0d] rounded-full text-[#212529] text-sm">
                        {value as number} x {labels[key] || key}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Active Revision Requests - PRIORITY */}
          {revisions.filter(r => r.status === 'open').length > 0 && (
            <Card className="border-2 border-orange-500 bg-orange-500/5">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#212529] mb-2"> נדרשים תיקונים</h2>
                  <p className="text-orange-200 mb-4">המותג ביקש תיקונים לתוכן. העלה קובץ מתוקן בהמשך הדף ↓</p>
                </div>
              </div>
              <div className="space-y-3">
                {revisions.filter(r => r.status === 'open').map((revision) => (
                  <div key={revision.id} className="bg-[#f8f9fa] rounded-lg p-4 border border-orange-500">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {revision.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-600 text-[#212529] text-sm rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-[#212529] mb-2 text-lg">{revision.note}</p>
                    <span className="text-xs text-[#6c757d]">
                      התקבל: {new Date(revision.created_at).toLocaleDateString('he-IL')} {new Date(revision.created_at).toLocaleTimeString('he-IL')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Upload Section */}
          {canUpload && (
            <Card className={task.status === 'needs_edits' ? 'border-2 border-orange-500' : ''}>
              <h2 className="text-xl font-bold text-[#212529] mb-4">
                {task.status === 'needs_edits' ? '️ העלאת תיקון' : ' העלאת תוכן'}
              </h2>
              {task.status === 'needs_edits' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
                  <p className="text-orange-300 font-medium">
                     העלה כאן את הקובץ המתוקן. לאחר ההעלאה, המשימה תעבור אוטומטית לסטטוס "הועלה" והמותג יוכל לבדוק שוב.
                  </p>
                </div>
              )}
              <div className="bg-[#f8f9fa] rounded-lg p-8 border-2 border-dashed border-[#dee2e6]">
                <div className="text-center mb-4">
                  
                  <p className="text-[#6c757d] mb-4">
                    {task.status === 'needs_edits' 
                      ? 'העלה את הקובץ המתוקן כאן' 
                      : 'העלה תמונות או סרטונים של התוכן שיצרת'}
                  </p>
                  <p className="text-sm text-[#6c757d] mb-4">
                    קבצים נתמכים: JPG, PNG, GIF, WebP, MP4, MOV, AVI (עד 50MB)
                  </p>
                </div>

                {/* Deliverable Type Selector */}
                {task.campaigns?.deliverables && Object.keys(task.campaigns.deliverables).length > 0 && (
                  <div className="mb-6 max-w-md mx-auto">
                    <label className="block text-sm font-medium text-[#212529] mb-2 text-center">
                      סוג התוכן שמועלה *
                    </label>
                    <select
                      value={selectedDeliverableType}
                      onChange={(e) => setSelectedDeliverableType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                    >
                      <option value="">-- בחר סוג תוכן --</option>
                      {Object.entries(task.campaigns.deliverables).map(([key, value]) => {
                        if (!value || (value as number) === 0) return null;
                        const uploadedCount = getUploadedCount(key);
                        const requiredCount = value as number;
                        const isCompleted = uploadedCount >= requiredCount;
                        
                        return (
                          <option key={key} value={key}>
                            {DELIVERABLE_LABELS[key] || key} ({uploadedCount}/{requiredCount} {isCompleted ? '' : ''})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="flex justify-center">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    id="file-upload"
                    className="hidden"
                    multiple
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className={cn(
                      'inline-block font-bold rounded-lg transition-all px-6 py-3 text-base',
                      uploading ? 'bg-gray-500 text-[#212529] cursor-not-allowed' : 'bg-[#f2cc0d] text-black hover:bg-[#d4b50c]'
                    )}>
                      {uploading ? `מעלה... ${uploadProgress}%` : 'בחר קבצים להעלאה (מרובים)'}
                    </span>
                  </label>
                </div>
                {!uploading && (
                  <p className="text-center text-xs text-[#6c757d] mt-2">
                     ניתן לבחור מספר קבצים בו-זמנית
                  </p>
                )}
                {uploading && (
                  <div className="mt-4">
                    <div className="w-full bg-white rounded-full h-2">
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
              <h2 className="text-xl font-bold text-[#212529] mb-4">היסטוריית העלאות</h2>
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <div key={upload.id} className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[#212529] font-medium">{upload.meta?.filename || upload.storage_path.split('/').pop()}</div>
                        <div className="flex items-center gap-2 text-xs text-[#6c757d]">
                          <span>{new Date(upload.created_at).toLocaleDateString('he-IL')} {new Date(upload.created_at).toLocaleTimeString('he-IL')}</span>
                          {upload.meta?.deliverable_type && (
                            <span className="bg-white px-2 py-0.5 rounded border border-[#dee2e6]">
                              {DELIVERABLE_LABELS[upload.meta.deliverable_type] || upload.meta.deliverable_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        upload.status === 'approved' ? 'bg-green-500 text-[#212529]' :
                        upload.status === 'rejected' ? 'bg-red-500 text-[#212529]' :
                        'bg-gray-500 text-[#212529]'
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

      <TutorialPopup tutorialKey="creator_task_detail" />
    </div>
  );
}
