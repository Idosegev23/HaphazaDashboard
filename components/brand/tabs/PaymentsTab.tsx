'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';

type PaymentsTabProps = {
  campaignId: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  task_id: string;
  creator_name: string;
  creator_avatar: string | null;
  task_title: string;
  proof_url: string | null;
  invoice_url: string | null;
  paid_at: string | null;
  notes: string | null;
};

export function PaymentsTab({ campaignId }: PaymentsTabProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadingProof, setUploadingProof] = useState<string | null>(null); // payment ID being uploaded

  useEffect(() => {
    loadPayments();
  }, [campaignId]);

  const loadPayments = async () => {
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

    // Get payments for these tasks
    const { data: paymentsData, error } = await supabase
      .from('payments')
      .select('*')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading payments:', error);
      setLoading(false);
      return;
    }

    // Enrich with creator and task data
    const enriched = await Promise.all(
      (paymentsData || []).map(async (payment: any) => {
        const task = tasksData.find((t) => t.id === payment.task_id);
        const { data: profileData } = await supabase
          .from('users_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', task?.creator_id || '')
          .single();

        return {
          ...payment,
          task_title: task?.title || 'לא זמין',
          creator_name: profileData?.display_name || 'לא זמין',
          creator_avatar: profileData?.avatar_url || null,
        };
      })
    );

    setPayments(enriched);
    setLoading(false);
  };

  const handleUploadProof = async (paymentId: string, file: File) => {
    setUploadingProof(paymentId);
    const supabase = createClient();

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${paymentId}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-uploads')
        .getPublicUrl(fileName);

      // Update payment with proof URL
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          proof_url: urlData.publicUrl,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      alert(' אסמכתת התשלום הועלתה בהצלחה!');
      loadPayments(); // Reload
    } catch (error: any) {
      console.error('Error uploading proof:', error);
      alert('שגיאה בהעלאת אסמכתא: ' + error.message);
    } finally {
      setUploadingProof(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#212529] text-xl">טוען תשלומים...</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: 'ממתין',
    processing: 'בעיבוד',
    paid: 'שולם',
    failed: 'נכשל',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    paid: 'bg-green-500',
    failed: 'bg-red-500',
  };

  const filteredPayments =
    statusFilter === 'all' ? payments : payments.filter((p) => p.status === statusFilter);

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidAmount = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <div className="text-[#6c757d] text-sm mb-1">תשלומים ששולמו</div>
          <div className="text-2xl font-bold text-green-400">₪{paidAmount.toLocaleString()}</div>
          <div className="text-xs text-[#6c757d] mt-1">
            {payments.filter((p) => p.status === 'paid').length} תשלומים
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
          <div className="text-[#6c757d] text-sm mb-1">ממתינים לתשלום</div>
          <div className="text-2xl font-bold text-yellow-400">₪{pendingAmount.toLocaleString()}</div>
          <div className="text-xs text-[#6c757d] mt-1">
            {payments.filter((p) => p.status === 'pending').length} תשלומים
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#f2cc0d]/10 to-[#f2cc0d]/5 border-[#f2cc0d]/30">
          <div className="text-[#6c757d] text-sm mb-1">סה"כ</div>
          <div className="text-2xl font-bold text-[#f2cc0d]">
            ₪{(paidAmount + pendingAmount).toLocaleString()}
          </div>
          <div className="text-xs text-[#6c757d] mt-1">{payments.length} תשלומים</div>
        </Card>
      </div>

      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#212529]"> תשלומים</h2>
          <p className="text-[#6c757d] text-sm">
            {filteredPayments.length} תשלומים
            {statusFilter !== 'all' && ` (${statusLabels[statusFilter]})`}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="pending">
            ממתין ({payments.filter((p) => p.status === 'pending').length})
          </option>
          <option value="processing">
            בעיבוד ({payments.filter((p) => p.status === 'processing').length})
          </option>
          <option value="paid">שולם ({payments.filter((p) => p.status === 'paid').length})</option>
          <option value="failed">נכשל ({payments.filter((p) => p.status === 'failed').length})</option>
        </select>
      </div>

      {/* Payments List */}
      {filteredPayments.length > 0 ? (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="relative">
              <div className={`status-stripe ${statusColors[payment.status || 'pending']}`} />
              <div className="pl-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-[#f8f9fa] border-2 border-[#f2cc0d]">
                      {payment.creator_avatar ? (
                        <img
                          src={payment.creator_avatar}
                          alt={payment.creator_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-[#f2cc0d]">
                          
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-[#212529] font-bold">{payment.creator_name}</h3>
                        <p className="text-[#6c757d] text-sm">{payment.task_title}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[#f2cc0d] font-bold text-xl">
                          ₪{payment.amount.toLocaleString()}
                        </div>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold text-[#212529] ${
                            statusColors[payment.status || 'pending']
                          }`}
                        >
                          {statusLabels[payment.status || 'pending']}
                        </span>
                        {payment.status === 'pending' && !payment.proof_url && (
                          <label
                            htmlFor={`proof-upload-${payment.id}`}
                            className="block mt-2 cursor-pointer"
                          >
                            <span className="inline-block px-3 py-1 bg-[#f2cc0d] text-black text-xs font-medium rounded hover:bg-[#d4b00b] transition-colors">
                              {uploadingProof === payment.id ? '⏳ מעלה...' : ' העלה אסמכתא'}
                            </span>
                            <input
                              id={`proof-upload-${payment.id}`}
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadProof(payment.id, file);
                              }}
                              disabled={uploadingProof === payment.id}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-[#6c757d] mb-2">
                      נוצר ב-{new Date(payment.created_at).toLocaleDateString('he-IL')}{' '}
                      {new Date(payment.created_at).toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {payment.paid_at && (
                        <span className="mr-2">
                          • שולם ב-{new Date(payment.paid_at).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>

                    {/* Documents Section */}
                    {(payment.proof_url || payment.invoice_url) && (
                      <div className="mt-3 pt-3 border-t border-[#dee2e6]">
                        <div className="text-xs text-[#6c757d] mb-2 font-medium"> מסמכים:</div>
                        <div className="flex flex-wrap gap-2">
                          {payment.proof_url && (
                            <a
                              href={payment.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#f2cc0d] hover:border-[#f2cc0d] transition-colors text-xs flex items-center gap-2"
                            >
                              
                              <span>אסמכתת תשלום</span>
                            </a>
                          )}
                          {payment.invoice_url && (
                            <a
                              href={payment.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#f2cc0d] hover:border-[#f2cc0d] transition-colors text-xs flex items-center gap-2"
                            >
                              
                              <span>חשבונית</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes Section */}
                    {payment.notes && (
                      <div className="mt-3 pt-3 border-t border-[#dee2e6]">
                        <div className="text-xs text-[#6c757d] mb-1 font-medium"> הערות:</div>
                        <p className="text-xs text-[#212529]">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-[#6c757d] text-center py-8">
            {payments.length === 0
              ? 'עדיין לא נוצרו תשלומים לקמפיין זה. תשלומים נוצרים אוטומטית כשתוכן מאושר.'
              : 'לא נמצאו תשלומים בסטטוס זה'}
          </p>
        </Card>
      )}

      {/* Info Box */}
      {payments.filter((p) => p.status === 'pending').length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">️</span>
            <div>
              <h4 className="text-[#212529] font-bold mb-1">תשלומים ממתינים</h4>
              <p className="text-yellow-200 text-sm">
                יש {payments.filter((p) => p.status === 'pending').length} תשלומים ממתינים בסכום כולל של
                ₪{pendingAmount.toLocaleString()}. תשלומים אלו נוצרו אוטומטית לאחר אישור תוכן.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
