'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Task = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  requires_product: boolean;
  payment_amount: number | null;
  created_at: string;
  creator_id: string;
  campaigns: {
    title: string;
  } | null;
  creators: {
    user_id: string;
    users_profiles: {
      display_name: string;
      email: string;
      age: number | null;
      gender: string | null;
      country: string | null;
    } | null;
    niches: string[] | null;
    platforms: any;
  } | null;
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

const REVISION_TAGS = [
  { value: 'hook', label: 'Hook - פתיחה' },
  { value: 'script', label: 'Script - תסריט' },
  { value: 'lighting', label: 'Lighting - תאורה' },
  { value: 'branding', label: 'Branding - מיתוג' },
  { value: 'audio', label: 'Audio - שמע' },
  { value: 'other', label: 'Other - אחר' },
];

export default function BrandTaskDetailPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [revisions, setRevisions] = useState<RevisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Revision form state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [revisionNote, setRevisionNote] = useState('');
  
  // Rating form state
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const [timelinessScore, setTimelinessScore] = useState(0);
  const [communicationScore, setCommunicationScore] = useState(0);
  const [ratingNote, setRatingNote] = useState('');

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id || !user?.brand_id) return;
    loadTaskData();
    subscribeToUpdates();
  }, [user?.id, user?.brand_id, taskId]);

  const loadTaskData = async () => {
    if (!user?.brand_id) {
      console.error('No brand_id found for user');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Load task with creator details - filter by brand_id through campaigns
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id, 
        title, 
        status, 
        due_at, 
        requires_product, 
        payment_amount,
        created_at, 
        creator_id,
        campaign_id,
        campaigns!inner(
          title,
          brand_id
        ),
        creators(
          user_id,
          niches,
          platforms,
          users_profiles(display_name, email, age, gender, country)
        )
      `)
      .eq('id', taskId)
      .eq('campaigns.brand_id', user.brand_id)
      .single();

    if (taskError || !taskData) {
      console.error('Error loading task:', taskError);
      setLoading(false);
      return;
    }

    // Task data is already complete with creator info
    let enrichedTask: any = taskData;
    
    // Fallback if creator details are missing
    if (!taskData.creators && (taskData as any).creator_id) {
      const { data: profileData } = await supabase
        .from('users_profiles')
        .select('display_name, email')
        .eq('user_id', (taskData as any).creator_id)
        .single();
      
      if (profileData) {
        enrichedTask.creators = {
          users_profiles: profileData
        };
      }
    }

    setTask(enrichedTask as Task);

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

    const taskChannel = supabase
      .channel(`task-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` }, () => {
        loadTaskData();
      })
      .subscribe();

    const uploadsChannel = supabase
      .channel(`uploads-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploads', filter: `task_id=eq.${taskId}` }, () => {
        loadTaskData();
      })
      .subscribe();

    return () => {
      taskChannel.unsubscribe();
      uploadsChannel.unsubscribe();
    };
  };

  const handleApprove = async () => {
    // UX Block: וודא שיש תוכן לאשר
    if (!uploads.length) {
      alert('אין תוכן לאשר.\nהמשפיען עדיין לא העלה קבצים.');
      return;
    }

    // קודם נבקש דירוג
    if (!showRatingForm) {
      setShowRatingForm(true);
      return;
    }

    // ולידציה של הדירוג
    if (!qualityScore || !timelinessScore || !communicationScore) {
      alert('יש לדרג את המשפיען בכל הקטגוריות (1-5)');
      return;
    }

    if (!confirm('האם אתה בטוח שברצונך לאשר את התוכן? זה ייצור תשלום עבור המשפיען.')) {
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      // Create rating first
      const { error: ratingError } = await supabase
        .from('ratings')
        .insert({
          task_id: taskId,
          quality_score: qualityScore,
          timeliness_score: timelinessScore,
          communication_score: communicationScore,
          note: ratingNote || null,
        });

      if (ratingError) throw ratingError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          task_id: taskId,
          decision: 'approve',
          note: 'תוכן אושר',
        });

      if (approvalError) throw approvalError;

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Get payment amount from task
      const paymentAmount = task?.payment_amount || 0;
      if (paymentAmount === 0) {
        throw new Error('סכום התשלום לא הוגדר למשימה זו');
      }

      // Create payment with amount from task
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          task_id: taskId,
          amount: paymentAmount,
          currency: 'ILS',
          status: 'pending',
        });

      if (paymentError) throw paymentError;

      // Audit log
      await supabase.rpc('log_audit', {
        p_entity: 'task',
        p_entity_id: taskId,
        p_action: 'approved',
        p_metadata: { payment_amount: paymentAmount }
      });

      alert('✅ התוכן אושר בהצלחה!\n\nהדירוג נשמר ותשלום נוצר עבור המשפיען.');
      setShowRatingForm(false);
      loadTaskData();
    } catch (error: any) {
      console.error('Approval error:', error);
      alert('שגיאה באישור: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    // UX Block: וודא שיש תוכן להעיר עליו
    if (!uploads.length) {
      alert('אין תוכן להעיר עליו.\nהמשפיען עדיין לא העלה קבצים.');
      return;
    }

    if (selectedTags.length === 0) {
      alert('יש לבחור לפחות תגית אחת');
      return;
    }

    if (!revisionNote.trim() || revisionNote.length < 10) {
      alert('יש להזין הערה מפורטת (לפחות 10 תווים)');
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      // Create revision request
      const { error: revisionError } = await supabase
        .from('revision_requests')
        .insert({
          task_id: taskId,
          tags: selectedTags,
          note: revisionNote,
          status: 'open',
        });

      if (revisionError) throw revisionError;

      // Audit log
      await supabase.rpc('log_audit', {
        p_entity: 'task',
        p_entity_id: taskId,
        p_action: 'revision_requested',
        p_metadata: { tags: selectedTags }
      });

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'needs_edits', updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (taskError) throw taskError;

      alert('✅ בקשת תיקון נשלחה למשפיען');
      setShowRevisionForm(false);
      setSelectedTags([]);
      setRevisionNote('');
      loadTaskData();
    } catch (error: any) {
      console.error('Revision request error:', error);
      alert('שגיאה בשליחת בקשת תיקון: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getFileUrl = async (path: string) => {
    const supabase = createClient();
    const { data } = supabase.storage.from('task-uploads').getPublicUrl(path);
    return data.publicUrl;
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
    selected: 'נבחר',
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

  const canReview = task.status === 'uploaded';

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/brand/tasks')}
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
                <span className="text-[#cbc190] text-sm">{task.campaigns.title}</span>
              )}
            </div>
          </div>
          {canReview && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowRevisionForm(!showRevisionForm)}
                disabled={processing}
                className="bg-orange-600 hover:bg-orange-700"
              >
                בקש תיקונים
              </Button>
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                אשר תוכן
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Creator Details */}
          {task.creators && (
            <Card className="border border-[#f2cc0d]">
              <h2 className="text-xl font-bold text-white mb-4">👤 פרטי המשפיענית</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#cbc190] text-sm">שם</span>
                    <div className="text-white font-medium text-lg">
                      {task.creators.users_profiles?.display_name || 'לא זמין'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#cbc190] text-sm">אימייל</span>
                    <div className="text-white font-medium">
                      <a href={`mailto:${task.creators.users_profiles?.email}`} className="hover:text-[#f2cc0d] transition-colors">
                        {task.creators.users_profiles?.email || 'לא זמין'}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {task.creators.users_profiles?.age && (
                    <div>
                      <span className="text-[#cbc190] text-sm">גיל</span>
                      <div className="text-white font-medium">{task.creators.users_profiles.age}</div>
                    </div>
                  )}
                  {task.creators.users_profiles?.gender && (
                    <div>
                      <span className="text-[#cbc190] text-sm">מגדר</span>
                      <div className="text-white font-medium">
                        {task.creators.users_profiles.gender === 'female' ? 'נקבה' : task.creators.users_profiles.gender === 'male' ? 'זכר' : 'אחר'}
                      </div>
                    </div>
                  )}
                  {task.creators.users_profiles?.country && (
                    <div>
                      <span className="text-[#cbc190] text-sm">מדינה</span>
                      <div className="text-white font-medium">{task.creators.users_profiles.country}</div>
                    </div>
                  )}
                </div>

                {task.creators.niches && task.creators.niches.length > 0 && (
                  <div>
                    <span className="text-[#cbc190] text-sm block mb-2">נישות</span>
                    <div className="flex flex-wrap gap-2">
                      {task.creators.niches.map((niche, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[#2e2a1b] border border-[#494222] rounded-full text-white text-sm">
                          {niche}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {task.creators.platforms && (
                  <div>
                    <span className="text-[#cbc190] text-sm block mb-2">פלטפורמות</span>
                    <div className="grid md:grid-cols-2 gap-3">
                      {task.creators.platforms.instagram && (
                        <a
                          href={`https://instagram.com/${task.creators.platforms.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-[#2e2a1b] border border-[#494222] rounded-lg hover:border-[#f2cc0d] transition-colors"
                        >
                          <span className="text-2xl">📷</span>
                          <div>
                            <div className="text-white text-sm font-medium">Instagram</div>
                            <div className="text-[#cbc190] text-xs">@{task.creators.platforms.instagram}</div>
                          </div>
                        </a>
                      )}
                      {task.creators.platforms.tiktok && (
                        <a
                          href={`https://tiktok.com/@${task.creators.platforms.tiktok}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-[#2e2a1b] border border-[#494222] rounded-lg hover:border-[#f2cc0d] transition-colors"
                        >
                          <span className="text-2xl">🎵</span>
                          <div>
                            <div className="text-white text-sm font-medium">TikTok</div>
                            <div className="text-[#cbc190] text-xs">@{task.creators.platforms.tiktok}</div>
                          </div>
                        </a>
                      )}
                      {task.creators.platforms.youtube && (
                        <a
                          href={task.creators.platforms.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-[#2e2a1b] border border-[#494222] rounded-lg hover:border-[#f2cc0d] transition-colors"
                        >
                          <span className="text-2xl">▶️</span>
                          <div>
                            <div className="text-white text-sm font-medium">YouTube</div>
                            <div className="text-[#cbc190] text-xs">ערוץ</div>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
                  <div className="text-white font-medium">
                    {task.campaigns?.title || 'לא זמין'}
                  </div>
                </div>
                {task.payment_amount && (
                  <div>
                    <span className="text-[#cbc190] text-sm">תשלום למשפיענית</span>
                    <div className="text-[#f2cc0d] font-bold text-lg">
                      ₪{task.payment_amount.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              {task.due_at && (
                <div>
                  <span className="text-[#cbc190] text-sm">תאריך יעד</span>
                  <div className="text-white font-medium">
                    {new Date(task.due_at).toLocaleDateString('he-IL')}
                  </div>
                </div>
              )}
              {task.requires_product && (
                <div>
                  <span className="text-[#cbc190] text-sm">דרוש מוצר פיזי</span>
                  <div className="text-white font-medium">✅ כן</div>
                </div>
              )}
            </div>
          </Card>

          {/* Rating Form */}
          {showRatingForm && canReview && (
            <Card className="border-2 border-green-500">
              <h2 className="text-xl font-bold text-white mb-4">דרג את המשפיען (חובה)</h2>
              <p className="text-[#cbc190] mb-4">לפני אישור התוכן, אנא דרג את העבודה של המשפיען</p>
              
              <div className="space-y-4">
                {/* Quality Score */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    איכות התוכן (חובה) *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setQualityScore(score)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          qualityScore === score
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-[#2e2a1b] border-[#494222] text-[#cbc190] hover:border-green-500'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#cbc190] mt-1">1 = גרוע, 5 = מצוין</p>
                </div>

                {/* Timeliness Score */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    עמידה בזמנים (חובה) *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setTimelinessScore(score)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          timelinessScore === score
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-[#2e2a1b] border-[#494222] text-[#cbc190] hover:border-green-500'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Communication Score */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    תקשורת (חובה) *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setCommunicationScore(score)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          communicationScore === score
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-[#2e2a1b] border-[#494222] text-[#cbc190] hover:border-green-500'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    הערות נוספות (אופציונלי)
                  </label>
                  <textarea
                    value={ratingNote}
                    onChange={(e) => setRatingNote(e.target.value)}
                    placeholder="הערות או פידבק נוסף למשפיען..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={processing || !qualityScore || !timelinessScore || !communicationScore}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? 'מאשר...' : 'אשר תוכן ושלח דירוג'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRatingForm(false);
                      setQualityScore(0);
                      setTimelinessScore(0);
                      setCommunicationScore(0);
                      setRatingNote('');
                    }}
                    className="bg-[#2e2a1b] hover:bg-[#3a3525]"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Revision Form */}
          {showRevisionForm && canReview && (
            <Card className="border-2 border-orange-500">
              <h2 className="text-xl font-bold text-white mb-4">בקשת תיקונים</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    בחר תגיות (חובה) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REVISION_TAGS.map((tag) => (
                      <button
                        key={tag.value}
                        onClick={() => toggleTag(tag.value)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedTags.includes(tag.value)
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-[#2e2a1b] border-[#494222] text-[#cbc190] hover:border-orange-500'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    הערה למשפיען (חובה) *
                  </label>
                  <textarea
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="הסבר למשפיען מה צריך לתקן..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleRequestRevision}
                    disabled={processing || selectedTags.length === 0 || !revisionNote.trim()}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {processing ? 'שולח...' : 'שלח בקשת תיקון'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRevisionForm(false);
                      setSelectedTags([]);
                      setRevisionNote('');
                    }}
                    className="bg-[#2e2a1b] hover:bg-[#3a3525]"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Uploaded Content */}
          {uploads.length > 0 && (
            <Card>
              <h2 className="text-xl font-bold text-white mb-4">תוכן שהועלה</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {uploads.map((upload) => (
                  <div key={upload.id} className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                    <div className="mb-3">
                      {upload.meta?.type?.startsWith('image/') ? (
                        <img
                          src={`/api/storage/task-uploads/${upload.storage_path}`}
                          alt="Uploaded content"
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : upload.meta?.type?.startsWith('video/') ? (
                        <video
                          src={`/api/storage/task-uploads/${upload.storage_path}`}
                          controls
                          className="w-full h-48 rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-[#1E1E1E] rounded-lg flex items-center justify-center">
                          <span className="text-4xl">📄</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium text-sm">{upload.meta?.filename || 'קובץ'}</div>
                        <span className="text-xs text-[#cbc190]">
                          {new Date(upload.created_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      <a
                        href={`/api/storage/task-uploads/${upload.storage_path}`}
                        download
                        className="text-[#f2cc0d] hover:text-[#d4b50c] transition-colors"
                      >
                        ⬇️ הורד
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Revision History */}
          {revisions.length > 0 && (
            <Card>
              <h2 className="text-xl font-bold text-white mb-4">היסטוריית תיקונים</h2>
              <div className="space-y-3">
                {revisions.map((revision) => (
                  <div key={revision.id} className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {revision.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                          {REVISION_TAGS.find(t => t.value === tag)?.label || tag}
                        </span>
                      ))}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        revision.status === 'open' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {revision.status === 'open' ? 'פתוח' : 'טופל'}
                      </span>
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
        </div>
      </div>
    </div>
  );
}
