'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  invoice_url: string | null;
  proof_url: string | null;
  tasks: {
    title: string;
    creator_id: string;
    campaigns: {
      title: string;
      brand_id: string;
    } | null;
    creators: {
      users_profiles: {
        display_name: string;
        email: string;
      } | null;
    } | null;
  } | null;
};

export default function BrandPaymentsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.brand_id) return;
    loadPayments();
    subscribeToUpdates();
  }, [user?.brand_id, userLoading]);

  const loadPayments = async () => {
    const supabase = createClient();

    // First get the payments
    const { data: paymentsData, error } = await supabase
      .from('payments')
      .select(`
        id, 
        amount, 
        currency, 
        status, 
        created_at, 
        paid_at, 
        invoice_url,
        proof_url,
        tasks!inner(
          title, 
          creator_id,
          campaigns!inner(
            title, 
            brand_id
          )
        )
      `)
      .eq('tasks.campaigns.brand_id', user?.brand_id!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading payments:', error);
      setLoading(false);
      return;
    }

    // Then enrich with creator details
    const enrichedPayments = await Promise.all(
      (paymentsData || []).map(async (payment: any) => {
        const { data: creatorProfile } = await supabase
          .from('users_profiles')
          .select('display_name, email')
          .eq('user_id', payment.tasks.creator_id)
          .single();

        return {
          ...payment,
          tasks: {
            ...payment.tasks,
            creators: {
              users_profiles: creatorProfile
            }
          }
        };
      })
    );

    setPayments(enrichedPayments as Payment[]);
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const supabase = createClient();
    const channel = supabase
      .channel('brand_payment_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadPayments();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleFileUpload = async (paymentId: string, file: File) => {
    setUploading(paymentId);
    const supabase = createClient();

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `proof_${paymentId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-uploads')
        .getPublicUrl(filePath);

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          proof_url: publicUrl,
          status: 'paid', // Auto-mark as paid when proof is uploaded
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Audit log
      await supabase.rpc('log_audit', {
        p_entity: 'payment',
        p_entity_id: paymentId,
        p_action: 'proof_uploaded',
        p_metadata: { url: publicUrl }
      });

      alert('✅ אישור העברה הועלה בהצלחה והתשלום סומן כשולם');
      loadPayments();
    } catch (error: any) {
      console.error('Error uploading proof:', error);
      alert('שגיאה בהעלאת הקובץ: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  // Filter payments by status
  const toPayPayments = payments.filter(p => p.status === 'pending');
  const waitingInvoicePayments = payments.filter(p => p.status === 'paid' && !p.invoice_url);
  const completedPayments = payments.filter(p => p.status === 'paid' && p.invoice_url);

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">תשלומים</h1>
        <p className="text-[#cbc190]">ניהול תשלומים למשפיענים</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Section 1: To Pay */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>💳</span> לתשלום ({toPayPayments.length})
            </h2>
            <Card className="border-l-4 border-l-yellow-500">
              <div className="space-y-4">
                {toPayPayments.length === 0 ? (
                  <p className="text-center text-[#cbc190] py-4">אין תשלומים ממתינים לביצוע</p>
                ) : (
                  toPayPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-[#2e2a1b] rounded-lg p-6 border border-[#494222] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {payment.tasks?.title}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-black bg-yellow-500">
                            ממתין לתשלום
                          </span>
                        </div>
                        <div className="text-sm text-[#cbc190] mb-1">
                          קמפיין: {payment.tasks?.campaigns?.title}
                        </div>
                        <div className="text-sm text-[#cbc190]">
                          משפיען: {payment.tasks?.creators?.users_profiles?.display_name} ({payment.tasks?.creators?.users_profiles?.email})
                        </div>
                      </div>

                      <div className="text-left min-w-[200px]">
                        <div className="text-3xl font-bold text-[#f2cc0d] mb-4">
                          ₪{Number(payment.amount).toLocaleString()}
                        </div>
                        <div>
                          <input
                            type="file"
                            id={`proof-${payment.id}`}
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(payment.id, file);
                            }}
                          />
                          <Button
                            onClick={() => document.getElementById(`proof-${payment.id}`)?.click()}
                            disabled={uploading === payment.id}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {uploading === payment.id ? 'מעלה...' : '📤 העלה אישור העברה'}
                          </Button>
                          <p className="text-xs text-[#cbc190] mt-2 text-center">
                            העלאת אישור תסמן את התשלום כשולם
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          {/* Section 2: Waiting for Invoice */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📄</span> ממתין לחשבונית ({waitingInvoicePayments.length})
            </h2>
            <Card className="border-l-4 border-l-orange-500">
              <div className="space-y-4">
                {waitingInvoicePayments.length === 0 ? (
                  <p className="text-center text-[#cbc190] py-4">אין תשלומים שממתינים לחשבונית</p>
                ) : (
                  waitingInvoicePayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-[#2e2a1b] rounded-lg p-6 border border-[#494222] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {payment.tasks?.title}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-green-600">
                            שולם
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-orange-500 animate-pulse">
                            חסרה חשבונית
                          </span>
                        </div>
                        <div className="text-sm text-[#cbc190] mb-1">
                          קמפיין: {payment.tasks?.campaigns?.title}
                        </div>
                        <div className="text-sm text-[#cbc190] mb-3">
                          משפיען: {payment.tasks?.creators?.users_profiles?.display_name}
                        </div>
                        {payment.proof_url && (
                          <a
                            href={payment.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:underline text-sm flex items-center gap-1"
                          >
                            ✅ צפה באישור העברה
                          </a>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold text-[#f2cc0d]">
                          ₪{Number(payment.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-orange-400 mt-1">
                          ממתין להעלאת חשבונית ע"י המשפיען
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          {/* Section 3: History / Completed */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>✅</span> היסטוריה ({completedPayments.length})
            </h2>
            <Card className="border-l-4 border-l-green-500">
              <div className="space-y-4">
                {completedPayments.length === 0 ? (
                  <p className="text-center text-[#cbc190] py-4">אין היסטוריית תשלומים</p>
                ) : (
                  completedPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-[#2e2a1b] rounded-lg p-6 border border-[#494222] flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {payment.tasks?.title}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-green-600">
                            הושלם
                          </span>
                        </div>
                        <div className="text-sm text-[#cbc190] mb-1">
                          קמפיין: {payment.tasks?.campaigns?.title}
                        </div>
                        <div className="text-sm text-[#cbc190] mb-3">
                          משפיען: {payment.tasks?.creators?.users_profiles?.display_name}
                        </div>
                        <div className="flex gap-4">
                          {payment.proof_url && (
                            <a
                              href={payment.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:underline text-sm"
                            >
                              ✅ אישור העברה
                            </a>
                          )}
                          {payment.invoice_url && (
                            <a
                              href={payment.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#f2cc0d] hover:underline text-sm"
                            >
                              📄 חשבונית מס
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold text-[#f2cc0d]">
                          ₪{Number(payment.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-green-400 mt-1">
                          תהליך הושלם
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

        </div>
      </div>
    </div>
  );
}
