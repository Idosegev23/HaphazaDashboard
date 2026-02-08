'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewCampaignPage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    concept: '',
    fixedPrice: '',
    deadline: '',
  });
  
  // Deliverables state
  const [deliverables, setDeliverables] = useState({
    instagram_story: 0,
    instagram_reel: 0,
    instagram_post: 0,
    tiktok_video: 0,
    ugc_video: 0,
    photo: 0,
  });

  const DELIVERABLE_LABELS: Record<string, string> = {
    instagram_story: 'Instagram Story',
    instagram_reel: 'Instagram Reel',
    instagram_post: 'Instagram Post',
    tiktok_video: 'TikTok Video',
    ugc_video: 'UGC Video',
    photo: 'Photo (תמונה)',
  };

  const updateDeliverable = (key: keyof typeof deliverables, change: number) => {
    setDeliverables(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + change)
    }));
  };
  
  const [loading, setLoading] = useState(false);
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [uploadingBrief, setUploadingBrief] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return;

    const { data: membership } = await supabase
      .from('memberships')
      .select('entity_id')
      .eq('user_id', authUser.id)
      .eq('entity_type', 'brand')
      .single();

    setUser({ ...authUser, brand_id: membership?.entity_id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      // Upload brief file if exists
      let briefUrl = null;
      if (briefFile) {
        setUploadingBrief(true);
        const fileExt = briefFile.name.split('.').pop();
        const fileName = `brief_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('campaign-briefs')
          .upload(fileName, briefFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-briefs')
          .getPublicUrl(fileName);

        briefUrl = publicUrl;
        setUploadingBrief(false);
      }

      // Create campaign
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          brand_id: user.brand_id,
          title: formData.title,
          objective: formData.objective,
          concept: formData.concept,
          fixed_price: formData.fixedPrice ? Number(formData.fixedPrice) : null,
          currency: 'ILS',
          deadline: formData.deadline || null,
          status: 'draft',
          deliverables: deliverables,
          brief_url: briefUrl,
        })
        .select()
        .single();

      if (error) throw error;

      // Redirect to the campaign detail page
      router.push(`/brand/campaigns/${data.id}`);
    } catch (error: any) {
      alert('שגיאה: ' + error.message);
    } finally {
      setLoading(false);
      setUploadingBrief(false);
    }
  };

  if (!user) return <div className="p-8 text-white">טוען...</div>;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← חזרה
        </Button>

        <Card>
          <h1 className="text-3xl font-bold text-white mb-8">קמפיין חדש</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="שם הקמפיין"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="שם הקמפיין"
              required
            />

            <div>
              <label className="block text-sm font-medium text-white mb-2">יעד הקמפיין</label>
              <textarea
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                rows={3}
                placeholder="מה אתם מנסים להשיג עם הקמפיין?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">קונספט</label>
              <textarea
                value={formData.concept}
                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                rows={4}
                placeholder="תארו את הקונספט של הקמפיין..."
                required
              />
            </div>

            <Input
              label="מחיר למשפיען (₪)"
              type="number"
              value={formData.fixedPrice}
              onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
              placeholder="1000"
              required
            />

            <Input
              label="תאריך יעד"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />

            {/* Brief Upload Section */}
            <div className="bg-[#2e2a1b] p-6 rounded-lg border border-[#494222]">
              <h3 className="text-lg font-bold text-white mb-3">העלאת בריף (אופציונלי)</h3>
              <p className="text-[#cbc190] text-sm mb-4">
                העלה קובץ בריף מפורט (PDF/DOCX) שהמשפיען יוכל להוריד ולקרוא
              </p>
              
              {briefFile ? (
                <div className="flex items-center justify-between bg-[#1E1E1E] p-4 rounded-lg border border-[#494222]">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <div className="text-white font-medium">{briefFile.name}</div>
                      <div className="text-xs text-[#cbc190]">{(briefFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBriefFile(null)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    🗑️ הסר
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="brief-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setBriefFile(file);
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('brief-upload')?.click()}
                    className="bg-[#2e2a1b] border border-[#494222] hover:bg-[#3a3525]"
                  >
                    📎 בחר קובץ בריף
                  </Button>
                </div>
              )}
            </div>

            {/* Deliverables Section */}
            <div className="bg-[#2e2a1b] p-6 rounded-lg border border-[#494222]">
              <h3 className="text-lg font-bold text-white mb-4">תמהיל תוצרים דרוש</h3>
              <p className="text-[#cbc190] text-sm mb-4">בחר את כמות התוצרים מכל סוג שעל המשפיען לספק:</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(DELIVERABLE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex flex-col items-center p-3 bg-[#1E1E1E] rounded-lg border border-[#494222]">
                    <span className="text-white text-sm mb-2">{label}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateDeliverable(key as any, -1)}
                        className="w-8 h-8 rounded-full bg-[#2e2a1b] text-white hover:bg-[#3a3525] flex items-center justify-center text-xl"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-[#f2cc0d] w-6 text-center">
                        {deliverables[key as keyof typeof deliverables]}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateDeliverable(key as any, 1)}
                        className="w-8 h-8 rounded-full bg-[#f2cc0d] text-black hover:bg-[#d4b00b] flex items-center justify-center text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || uploadingBrief}>
                {uploadingBrief ? 'מעלה בריף...' : loading ? 'שומר...' : 'יצירת קמפיין'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
