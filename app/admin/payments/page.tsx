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

type BatchPayout = {
  id: string;
  created_at: string;
  created_by: string;
  status: string;
  payment_ids: string[];
  total_amount: number;
  executed_at: string | null;
  notes: string | null;
};

export default function AdminPaymentsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [batches, setBatches] = useState<BatchPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'failed' | 'batches'>('pending');
  
  // Batch selection
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchNotes, setBatchNotes] = useState('');

  useEffect(() => {
    if (user && !['admin', 'finance'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    loadPayments();
    loadBatches();
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

  const loadBatches = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('batch_payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading batches:', error);
      return;
    }

    setBatches(data || []);
  };

  const subscribeToUpdates = () => {
    const supabase = createClient();

    const channel = supabase
      .channel('payment_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadPayments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batch_payouts' }, () => {
        loadBatches();
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

      // Log audit
      await supabase.rpc('log_audit', {
        p_actor_id: user!.id,
        p_action: 'mark_payment_paid',
        p_entity: 'payments',
        p_entity_id: paymentId,
        p_meta: {}
      });

      alert('✅ Payment marked as paid successfully!');
      loadPayments();
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('Error marking payment as paid: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const toggleSelectAll = () => {
    const pendingPayments = payments.filter(p => p.status === 'pending');
    if (selectedPayments.size === pendingPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(pendingPayments.map(p => p.id)));
    }
  };

  const handleCreateBatchPayout = async () => {
    if (selectedPayments.size === 0) {
      alert('Please select at least one payment');
      return;
    }

    if (!confirm(`Create batch payout for ${selectedPayments.size} payments?`)) {
      return;
    }

    setProcessing('batch');
    const supabase = createClient();

    try {
      const selectedPaymentIds = Array.from(selectedPayments);
      const selectedPaymentData = payments.filter(p => selectedPaymentIds.includes(p.id));
      const totalAmount = selectedPaymentData.reduce((sum, p) => sum + Number(p.amount), 0);

      // Create batch payout
      const { data: batch, error: batchError } = await supabase
        .from('batch_payouts')
        .insert({
          created_by: user!.id,
          payment_ids: selectedPaymentIds,
          total_amount: totalAmount,
          notes: batchNotes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Update all selected payments to paid
      const { error: paymentsError } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .in('id', selectedPaymentIds);

      if (paymentsError) throw paymentsError;

      // Update all related tasks to paid
      const taskIds = selectedPaymentData.map(p => p.task_id);
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ status: 'paid' })
        .in('id', taskIds);

      if (tasksError) throw tasksError;

      // Mark batch as executed
      const { error: batchUpdateError } = await supabase
        .from('batch_payouts')
        .update({ 
          status: 'executed',
          executed_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      if (batchUpdateError) throw batchUpdateError;

      // Log audit
      await supabase.rpc('log_audit', {
        p_actor_id: user!.id,
        p_action: 'create_batch_payout',
        p_entity: 'batch_payouts',
        p_entity_id: batch.id,
        p_meta: { payment_count: selectedPaymentIds.length, total_amount: totalAmount }
      });

      alert(`✅ Batch payout created successfully! ${selectedPaymentIds.length} payments processed.`);
      setSelectedPayments(new Set());
      setBatchNotes('');
      setShowBatchModal(false);
      loadPayments();
      loadBatches();
    } catch (error: any) {
      console.error('Batch payout error:', error);
      alert('Error creating batch payout: ' + error.message);
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

  // Filter payments by tab
  const filteredPayments = payments.filter(p => {
    if (activeTab === 'pending') return p.status === 'pending';
    if (activeTab === 'paid') return p.status === 'paid';
    if (activeTab === 'failed') return p.status === 'failed';
    return false;
  });

  // Calculate totals
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const selectedTotal = payments
    .filter(p => selectedPayments.has(p.id))
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
        <p className="text-[#6c757d]">Manage creator payouts and batch operations</p>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:px-8 border-b border-[#dee2e6] bg-[#f8f9fa]">
        <div className="flex gap-6">
          {[
            { id: 'pending', label: 'Pending', count: payments.filter(p => p.status === 'pending').length },
            { id: 'paid', label: 'Paid', count: payments.filter(p => p.status === 'paid').length },
            { id: 'failed', label: 'Failed', count: payments.filter(p => p.status === 'failed').length },
            { id: 'batches', label: 'Batch History', count: batches.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#f2cc0d] text-[#212529]'
                  : 'border-transparent text-[#6c757d] hover:text-[#212529]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
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

          {/* Batch Actions Bar (for pending tab) */}
          {activeTab === 'pending' && selectedPayments.size > 0 && (
            <Card className="bg-blue-50 border-2 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#212529]">{selectedPayments.size} payments selected</div>
                  <div className="text-sm text-[#6c757d]">Total: ₪{selectedTotal.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowBatchModal(true)}
                    disabled={processing === 'batch'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Batch Payout
                  </Button>
                  <button
                    onClick={() => setSelectedPayments(new Set())}
                    className="text-[#6c757d] hover:text-[#212529]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Payments List */}
          {activeTab !== 'batches' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#212529]">{statusLabels[activeTab]} Payments</h2>
                {activeTab === 'pending' && filteredPayments.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {selectedPayments.size === filteredPayments.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              
              {filteredPayments.length > 0 ? (
                <div className="space-y-3">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-4 p-4 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]"
                    >
                      {activeTab === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedPayments.has(payment.id)}
                          onChange={() => togglePaymentSelection(payment.id)}
                          className="w-5 h-5"
                        />
                      )}
                      
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
                  <p className="text-[#6c757d] text-lg mb-2">No {activeTab} payments</p>
                </div>
              )}
            </Card>
          )}

          {/* Batch History */}
          {activeTab === 'batches' && (
            <Card>
              <h2 className="text-xl font-bold text-[#212529] mb-4">Batch Payout History</h2>
              {batches.length > 0 ? (
                <div className="space-y-3">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-[#212529] mb-1">
                            Batch #{batch.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-[#6c757d] mb-2">
                            {batch.payment_ids.length} payments • Created {new Date(batch.created_at).toLocaleDateString()}
                            {batch.executed_at && ` • Executed ${new Date(batch.executed_at).toLocaleDateString()}`}
                          </div>
                          {batch.notes && (
                            <div className="text-xs text-[#6c757d] italic mt-2">
                              Note: {batch.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#f2cc0d] mb-2">
                            ₪{Number(batch.total_amount).toLocaleString()}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                            batch.status === 'executed' ? 'bg-green-500' :
                            batch.status === 'failed' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}>
                            {batch.status === 'executed' ? 'Executed' : batch.status === 'failed' ? 'Failed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-[#6c757d] text-lg">No batch payouts yet</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Batch Payout Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#212529] mb-4">Create Batch Payout</h2>
            
            <div className="mb-6">
              <div className="text-sm text-[#6c757d] mb-2">Selected Payments: {selectedPayments.size}</div>
              <div className="text-3xl font-bold text-[#f2cc0d] mb-4">₪{selectedTotal.toLocaleString()}</div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {payments.filter(p => selectedPayments.has(p.id)).map(payment => (
                  <div key={payment.id} className="p-3 bg-[#f8f9fa] rounded border border-[#dee2e6]">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-[#212529]">{payment.tasks?.title}</div>
                        <div className="text-xs text-[#6c757d]">{payment.tasks?.campaigns?.brands?.name}</div>
                      </div>
                      <div className="font-bold text-[#f2cc0d]">₪{payment.amount}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#212529] mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Add notes about this batch payout..."
                  className="w-full px-4 py-2 border border-[#dee2e6] rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateBatchPayout}
                disabled={processing === 'batch'}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processing === 'batch' ? 'Processing...' : 'Execute Batch Payout'}
              </Button>
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchNotes('');
                }}
                className="px-6 py-2 text-[#6c757d] hover:text-[#212529]"
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
