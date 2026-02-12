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
  task_id: string;
  tasks: {
    title: string;
    creator_id: string;
    campaigns: {
      title: string;
      brands: {
        name: string;
      } | null;
    } | null;
  } | null;
};

export default function AdminPaymentsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user && !['admin', 'finance'].includes(user.role || '')) {
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
      .select('id, amount, currency, status, created_at, paid_at, task_id, tasks(title, creator_id, campaigns(title, brands(name)))')
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

  const handleMarkAsPaid = async (paymentId: string, taskId: string) => {
    if (!confirm('Are you sure you want to mark this payment as paid?')) {
      return;
    }

    setProcessing(paymentId);
    const supabase = createClient();

    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update task status to paid
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      alert('✅ Payment marked as paid successfully!');
      loadPayments();
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('Error marking payment as paid: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">Loading...</div>
      </div>
    );
  }

  // Calculate totals
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    paid: 'bg-green-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mb-2">Payments Console</h1>
        <p className="text-[#6c757d]">Manage creator payouts</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <div className="text-[#6c757d] text-sm mb-2">Total Paid</div>
              <div className="text-4xl font-bold text-[#f2cc0d]">₪{totalPaid.toLocaleString()}</div>
              <div className="text-xs text-[#6c757d] mt-2">
                {payments.filter(p => p.status === 'paid').length} payments completed
              </div>
            </Card>
            <Card>
              <div className="text-[#6c757d] text-sm mb-2">Pending Payouts</div>
              <div className="text-4xl font-bold text-yellow-400">₪{totalPending.toLocaleString()}</div>
              <div className="text-xs text-[#6c757d] mt-2">
                {payments.filter(p => p.status === 'pending').length} payments awaiting
              </div>
            </Card>
          </div>

          {/* Payments List */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4">All Payments</h2>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]"
                  >
                    <div className="flex-1">
                      <div className="text-[#212529] font-medium mb-1">
                        {payment.tasks?.title || 'Untitled Task'}
                      </div>
                      <div className="text-sm text-[#6c757d] mb-2">
                        {payment.tasks?.campaigns?.brands?.name} • {payment.tasks?.campaigns?.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6c757d]">
                        <span>Created: {new Date(payment.created_at).toLocaleDateString()}</span>
                        {payment.paid_at && (
                          <span className="text-green-400">
                            Paid: {new Date(payment.paid_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#f2cc0d] mb-2">
                          ₪{Number(payment.amount).toLocaleString()}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-[#212529] ${statusColors[payment.status]}`}>
                          {statusLabels[payment.status]}
                        </span>
                      </div>
                      {payment.status === 'pending' && (
                        <Button
                          onClick={() => handleMarkAsPaid(payment.id, payment.task_id)}
                          disabled={processing === payment.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processing === payment.id ? 'Processing...' : 'Mark as Paid'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💰</div>
                <p className="text-[#6c757d] text-lg mb-2">No payments yet</p>
                <p className="text-[#6c757d] text-sm opacity-70">
                  Payments will appear here after brands approve content
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
