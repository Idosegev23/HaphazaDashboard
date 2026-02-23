'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { INDUSTRIES } from '@/lib/constants/industries';

export default function BrandOnboardingPage() {
  const [brandId, setBrandId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brandName: '',
    industry: '',
    website: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadExistingBrand();
  }, []);

  const loadExistingBrand = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Get brand via brand_users
    const { data: brandUser } = await supabase
      .from('brand_users')
      .select('brand_id')
      .eq('user_id', user.id)
      .single();

    if (!brandUser) {
      setError('לא נמצא מותג מקושר לחשבון שלך');
      setLoading(false);
      return;
    }

    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandUser.brand_id)
      .single();

    if (brand) {
      setBrandId(brand.id);
      setFormData({
        brandName: brand.name || '',
        industry: brand.industry || '',
        website: brand.website || '',
      });
    }

    setLoading(false);
  };

  const normalizeWebsite = (url: string): string => {
    if (!url) return '';
    let normalized = url.trim();
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!brandId) {
      setError('לא נמצא מותג');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const normalizedWebsite = normalizeWebsite(formData.website);

    const { error: updateError } = await supabase
      .from('brands')
      .update({
        name: formData.brandName,
        industry: formData.industry,
        website: normalizedWebsite || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', brandId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push('/brand/dashboard');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#f8f9fa]">
        <div className="text-[#f2cc0d] text-xl font-bold">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fa] p-4" dir="rtl">
      <div className="max-w-3xl mx-auto py-12">
        <div className="glass-panel p-8 rounded-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#f2cc0d]/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">🏢</span>
            </div>
            <h1 className="text-3xl font-bold text-[#f2cc0d] mb-2">ברוכים הבאים ל-LEADERS!</h1>
            <p className="text-[#6c757d]">אשרו ועדכנו את פרטי המותג שלכם כדי להתחיל</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="שם המותג"
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              placeholder="שם החברה שלך"
              required
            />

            <div>
              <label className="block text-sm font-medium text-[#212529] mb-2">
                תעשייה *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-[#f2cc0d] transition-colors"
              >
                <option value="" disabled>בחר תעשייה...</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="אתר אינטרנט"
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="example.com או www.example.com"
            />

            <Button type="submit" disabled={saving} className="w-full" size="lg">
              {saving ? 'שומר...' : 'אישור והמשך לדשבורד'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
