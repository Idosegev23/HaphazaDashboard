'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  tasks: {
    title: string;
    campaigns: {
      title: string;
      brands: {
        name: string;
      } | null;
    } | null;
  } | null;
};

export default function CreatorPaymentsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'creator') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    loadPayments();
    subscribeToUpdates();
  }, [user?.id]);

  const loadPayments = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, currency, status, created_at, paid_at, tasks(title, campaigns(title, brands(name)))')
      .eq('tasks.creator_id', user?.id!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading payments:', error);
      setLoading(false);
      return;
    }

    setPayments(data as any || []);
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    const supabase = createClient();

    const channel = supabase
      .channel('payment_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadPayments();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  // Calculate totals
  const totalEarned = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const statusLabels: Record<string, string> = {
    pending: 'ממתין לתשלום',
    paid: 'שולם',
    failed: 'נכשל',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    paid: 'bg-green-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">תשלומים</h1>
        <p className="text-[#cbc190]">מעקב אחר רווחים והכנסות</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <div className="text-[#cbc190] text-sm mb-2">סה"כ הרווחים</div>
              <div className="text-4xl font-bold text-[#f2cc0d]">₪{totalEarned.toLocaleString()}</div>
              <div className="text-xs text-[#cbc190] mt-2">
                {payments.filter(p => p.status === 'paid').length} תשלומים שולמו
              </div>
            </Card>
            <Card>
              <div className="text-[#cbc190] text-sm mb-2">ממתין לתשלום</div>
              <div className="text-4xl font-bold text-yellow-400">₪{totalPending.toLocaleString()}</div>
              <div className="text-xs text-[#cbc190] mt-2">
                {payments.filter(p => p.status === 'pending').length} תשלומים ממתינים
              </div>
            </Card>
          </div>

          {/* Payments List */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">היסטוריית תשלומים</h2>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-[#2e2a1b] rounded-lg border border-[#494222] hover:border-[#f2cc0d] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">
                        {payment.tasks?.title || 'משימה ללא שם'}
                      </div>
                      <div className="text-sm text-[#cbc190] mb-2">
                        {payment.tasks?.campaigns?.title} • {payment.tasks?.campaigns?.brands?.name}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#cbc190]">
                        <span>נוצר: {new Date(payment.created_at).toLocaleDateString('he-IL')}</span>
                        {payment.paid_at && (
                          <span className="text-green-400">
                            שולם: {new Date(payment.paid_at).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-[#f2cc0d] mb-2">
                        ₪{Number(payment.amount).toLocaleString()}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[payment.status]}`}>
                        {statusLabels[payment.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💰</div>
                <p className="text-[#cbc190] text-lg mb-2">אין תשלומים עדיין</p>
                <p className="text-[#cbc190] text-sm opacity-70">
                  תשלומים יופיעו כאן לאחר שהמותג יאשר את התוכן שלך
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
