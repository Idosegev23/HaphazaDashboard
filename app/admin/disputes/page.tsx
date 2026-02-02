'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Dispute = {
  id: string;
  task_id: string;
  reason: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
  tasks: {
    title: string;
    campaigns: {
      title: string;
      brands: { name: string } | null;
    } | null;
    creators: {
      users_profiles: { display_name: string } | null;
    } | null;
  } | null;
  raised_by_profile: {
    display_name: string;
  } | null;
};

export default function AdminDisputesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionAction, setResolutionAction] = useState<'approve' | 'reject' | 'needs_edits'>('approve');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDisputes();
      subscribeToUpdates();
    }
  }, [user]);

  const loadDisputes = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        id,
        task_id,
        reason,
        status,
        resolution_note,
        created_at,
        resolved_at,
        tasks(
          title,
          campaigns(title, brands(name)),
          creators(users_profiles(display_name))
        ),
        raised_by_profile:users_profiles!disputes_raised_by_fkey(display_name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDisputes(data as any);
    }
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const supabase = createClient();
    const channel = supabase
      .channel('disputes-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => {
        loadDisputes();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleResolveDispute = async (disputeId: string, taskId: string) => {
    if (!resolutionNote.trim()) {
      alert('יש להזין הערת פתרון');
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך לפתור את המחלוקת?\nפעולה: ${resolutionAction === 'approve' ? 'אישור' : resolutionAction === 'reject' ? 'דחייה' : 'תיקונים'}`)) {
      return;
    }

    setProcessing(true);
    const supabase = createClient();

    try {
      // Update dispute status
      const { error: disputeError } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution_note: resolutionNote,
          resolved_by: user!.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      if (disputeError) throw disputeError;

      // Update task status based on resolution
      let newTaskStatus: 'approved' | 'needs_edits';
      switch (resolutionAction) {
        case 'approve':
          newTaskStatus = 'approved';
          break;
        case 'reject':
          newTaskStatus = 'needs_edits';
          break;
        case 'needs_edits':
          newTaskStatus = 'needs_edits';
          break;
      }

      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: newTaskStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Audit log
      await supabase.rpc('log_audit', {
        p_entity: 'dispute',
        p_entity_id: disputeId,
        p_action: 'resolved',
        p_metadata: { resolution_action: resolutionAction, task_id: taskId }
      });

      alert('המחלוקת נפתרה בהצלחה!');
      setSelectedDispute(null);
      setResolutionNote('');
      loadDisputes();
    } catch (error: any) {
      alert('שגיאה בפתרון מחלוקת: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  const openDisputes = disputes.filter(d => d.status === 'open');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">ניהול מחלוקות</h1>

        {/* Open Disputes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            מחלוקות פתוחות ({openDisputes.length})
          </h2>
          
          {openDisputes.length === 0 ? (
            <Card>
              <p className="text-[#cbc190]">אין מחלוקות פתוחות</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {openDisputes.map((dispute) => (
                <Card key={dispute.id} className="border-2 border-red-500">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {dispute.tasks?.title || 'משימה לא ידועה'}
                        </h3>
                        <div className="text-sm text-[#cbc190] space-y-1 mt-2">
                          <div>קמפיין: {dispute.tasks?.campaigns?.title || 'לא זמין'}</div>
                          <div>מותג: {dispute.tasks?.campaigns?.brands?.name || 'לא זמין'}</div>
                          <div>משפיען: {dispute.tasks?.creators?.users_profiles?.display_name || 'לא זמין'}</div>
                          <div>הועלה על ידי: {dispute.raised_by_profile?.display_name || 'לא זמין'}</div>
                          <div>תאריך: {new Date(dispute.created_at).toLocaleDateString('he-IL')}</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                        פתוח
                      </span>
                    </div>

                    <div className="bg-[#1E1E1E] p-4 rounded-lg">
                      <div className="text-sm text-[#cbc190] mb-1">סיבת המחלוקת:</div>
                      <div className="text-white">{dispute.reason}</div>
                    </div>

                    {selectedDispute === dispute.id ? (
                      <div className="bg-[#2e2a1b] p-4 rounded-lg border border-[#494222]">
                        <h4 className="text-white font-bold mb-3">פתרון המחלוקת</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              פעולה לנקיטה *
                            </label>
                            <select
                              value={resolutionAction}
                              onChange={(e) => setResolutionAction(e.target.value as any)}
                              className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                            >
                              <option value="approve">אישור התוכן</option>
                              <option value="needs_edits">דרישת תיקונים</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              הערת פתרון (חובה) *
                            </label>
                            <textarea
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              placeholder="הסבר את ההחלטה..."
                              rows={4}
                              className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleResolveDispute(dispute.id, dispute.task_id)}
                              disabled={processing || !resolutionNote.trim()}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing ? 'מעבד...' : 'פתור מחלוקת'}
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedDispute(null);
                                setResolutionNote('');
                              }}
                              className="bg-[#2e2a1b] hover:bg-[#3a3525]"
                            >
                              ביטול
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setSelectedDispute(dispute.id)}
                        className="bg-[#f2cc0d] text-black hover:bg-[#d4b30c]"
                      >
                        פתור מחלוקת
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Disputes */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            מחלוקות שנפתרו ({resolvedDisputes.length})
          </h2>
          
          {resolvedDisputes.length === 0 ? (
            <Card>
              <p className="text-[#cbc190]">אין מחלוקות שנפתרו</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {resolvedDisputes.map((dispute) => (
                <Card key={dispute.id} className="border border-green-500">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {dispute.tasks?.title || 'משימה לא ידועה'}
                        </h3>
                        <div className="text-sm text-[#cbc190] space-y-1 mt-2">
                          <div>הועלה: {new Date(dispute.created_at).toLocaleDateString('he-IL')}</div>
                          <div>נפתר: {dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleDateString('he-IL') : 'לא זמין'}</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                        נפתר
                      </span>
                    </div>

                    {dispute.resolution_note && (
                      <div className="bg-[#1E1E1E] p-4 rounded-lg">
                        <div className="text-sm text-[#cbc190] mb-1">הערת פתרון:</div>
                        <div className="text-white">{dispute.resolution_note}</div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
