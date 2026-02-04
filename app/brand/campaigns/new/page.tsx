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
  const [loading, setLoading] = useState(false);
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
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Redirect to the campaign detail page
    router.push(`/brand/campaigns/${data.id}`);
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

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'שומר...' : 'יצירת קמפיין'}
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
