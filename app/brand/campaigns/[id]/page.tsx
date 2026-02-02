'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Campaign = {
  id: string;
  title: string;
  objective: string | null;
  concept: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string | null;
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    concept: '',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
  });

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error loading campaign:', error);
      setLoading(false);
      return;
    }

    setCampaign(data);
    setFormData({
      title: data.title || '',
      objective: data.objective || '',
      concept: data.concept || '',
      budgetMin: data.budget_min?.toString() || '',
      budgetMax: data.budget_max?.toString() || '',
      deadline: data.deadline || '',
    });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('campaigns')
      .update({
        title: formData.title,
        objective: formData.objective,
        concept: formData.concept,
        budget_min: formData.budgetMin ? Number(formData.budgetMin) : null,
        budget_max: formData.budgetMax ? Number(formData.budgetMax) : null,
        deadline: formData.deadline || null,
      })
      .eq('id', campaignId);

    setSaving(false);

    if (error) {
      alert('שגיאה בשמירה: ' + error.message);
      return;
    }

    alert('הקמפיין נשמר בהצלחה!');
    loadCampaign();
  };

  const handlePublish = async () => {
    if (!confirm('האם אתה בטוח שברצונך לפרסם את הקמפיין? לאחר הפרסום, יוצרים יוכלו להגיש מועמדות.')) {
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('campaigns')
      .update({ status: 'open' })
      .eq('id', campaignId);

    setSaving(false);

    if (error) {
      alert('שגיאה בפרסום: ' + error.message);
      return;
    }

    alert('הקמפיין פורסם בהצלחה!');
    loadCampaign();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">קמפיין לא נמצא</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    open: 'פעיל',
    closed: 'סגור',
    completed: 'הושלם',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    open: 'bg-green-500',
    closed: 'bg-yellow-500',
    completed: 'bg-blue-500',
  };

  const currentStatus = campaign.status || 'draft';

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/brand/campaigns')}
                className="text-[#cbc190] hover:text-[#f2cc0d] transition-colors"
              >
                ← חזרה
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{campaign.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[currentStatus]}`}>
                {statusLabels[currentStatus]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#2e2a1b] hover:bg-[#3a3525]"
            >
              {saving ? 'שומר...' : 'שמור'}
            </Button>
            {currentStatus === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={saving}
                className="bg-[#f2cc0d] text-[#121212] hover:bg-[#d4b00b]"
              >
                פרסם קמפיין
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Info */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">פרטי הקמפיין</h2>
            <div className="space-y-4">
              <Input
                label="שם הקמפיין"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="שם מושך לקמפיין"
              />

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  מטרת הקמפיין
                </label>
                <textarea
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="תאר את המטרה העיקרית של הקמפיין"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  קונספט
                </label>
                <textarea
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  placeholder="תאר את הרעיון והסגנון של הקמפיין"
                  rows={4}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="תקציב מינימלי (₪)"
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  placeholder="1000"
                />

                <Input
                  label="תקציב מקסימלי (₪)"
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  placeholder="5000"
                />
              </div>

              <Input
                label="תאריך יעד"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </Card>

          {/* Additional Sections - Placeholder */}
          {currentStatus !== 'draft' && (
            <>
              <Card>
                <h2 className="text-xl font-bold text-white mb-4">בקשות יוצרים</h2>
                <div className="text-[#cbc190] text-center py-8">
                  בקרוב - כאן יופיעו בקשות היוצרים לקמפיין
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold text-white mb-4">יוצרים נבחרים</h2>
                <div className="text-[#cbc190] text-center py-8">
                  בקרוב - כאן יופיעו היוצרים שנבחרו לקמפיין
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
