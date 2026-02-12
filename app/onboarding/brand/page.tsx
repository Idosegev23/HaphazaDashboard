'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const INDUSTRIES = [
  "אופנה",
  "יופי וקוסמטיקה",
  "כושר ובריאות",
  "אוכל ומשקאות",
  "טכנולוגיה",
  "משחקים",
  "טיולים ונופש",
  "עיצוב הבית",
  "DIY ויצירה",
  "עסקים ויזמות",
  "חינוך",
  "בידור",
  "ספורט",
  "מוזיקה",
  "אמנות",
  "ספרים",
  "רכב",
  "ביטוח ופיננסים",
  "אחר",
];

export default function BrandOnboardingPage() {
  const [formData, setFormData] = useState({
    brandName: '',
    industry: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Function to normalize website URL
  const normalizeWebsite = (url: string): string => {
    if (!url) return '';
    
    let normalized = url.trim();
    
    // If it doesn't start with http:// or https://, add https://
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }
    
    return normalized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('No user found');
      setLoading(false);
      return;
    }

    // Normalize website URL
    const normalizedWebsite = normalizeWebsite(formData.website);

    // Create brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        name: formData.brandName,
        industry: formData.industry,
        website: normalizedWebsite,
        default_language: 'he',
      })
      .select()
      .single();

    if (brandError) {
      setError(brandError.message);
      setLoading(false);
      return;
    }

    // Create brand_user
    const { error: brandUserError } = await supabase.from('brand_users').insert({
      brand_id: brand.id,
      user_id: user.id,
      role: 'brand_manager',
      is_active: true,
    });

    if (brandUserError) {
      setError(brandUserError.message);
      setLoading(false);
      return;
    }

    // Create membership
    const { error: membershipError } = await supabase.from('memberships').insert({
      user_id: user.id,
      role: 'brand_manager',
      entity_type: 'brand',
      entity_id: brand.id,
      is_active: true,
    });

    if (membershipError) {
      setError(membershipError.message);
      setLoading(false);
      return;
    }

    router.push('/brand/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fa] p-4">
      <div className="max-w-3xl mx-auto py-12">
        <div className="glass-panel p-8 rounded-xl">
          <h1 className="text-3xl font-bold text-[#f2cc0d] mb-8">השלמת פרטי המותג</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
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
                className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
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

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'שומר...' : 'המשך'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
