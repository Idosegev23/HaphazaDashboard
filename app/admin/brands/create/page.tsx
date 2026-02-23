'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { INDUSTRIES } from '@/lib/constants/industries';
import Link from 'next/link';

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default function AdminCreateBrandPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState({
    brandName: '',
    industry: '',
    website: '',
    managerDisplayName: '',
    managerEmail: '',
    managerPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    brand: { id: string; name: string };
    user: { id: string; email: string };
  } | null>(null);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#f2cc0d] text-xl font-bold">טוען...</div>
      </div>
    );
  }

  if (!user || !['admin'].includes(user.role || '')) {
    router.push('/');
    return null;
  }

  const handleAutoPassword = () => {
    setFormData({ ...formData, managerPassword: generatePassword() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/create-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'שגיאה ביצירת המותג');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-[calc(100vh-70px)] bg-[#f4f5f7] p-4 md:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
              <h1 className="text-2xl font-bold text-[#212529] mb-2">המותג נוצר בהצלחה!</h1>
            </div>

            <div className="space-y-4 bg-[#f8f9fa] rounded-lg p-6 mb-6">
              <div>
                <span className="text-sm text-[#6c757d]">מותג:</span>
                <p className="font-bold text-[#212529]">{result.brand.name}</p>
              </div>
              <div>
                <span className="text-sm text-[#6c757d]">אימייל מנהל:</span>
                <p className="font-bold text-[#212529]">{result.user.email}</p>
              </div>
              <div>
                <span className="text-sm text-[#6c757d]">סיסמה:</span>
                <p className="font-mono font-bold text-[#212529] bg-white px-3 py-2 rounded border border-[#dee2e6] select-all">
                  {formData.managerPassword}
                </p>
              </div>
            </div>

            <p className="text-sm text-[#6c757d] mb-6 text-center">
              שמרו את פרטי הכניסה — הסיסמה לא תוצג שוב.
              <br />
              בכניסה הראשונה, מנהל המותג ישלים אונבורדינג.
            </p>

            <div className="flex gap-3">
              <Link href={`/admin/users/${result.user.id}`} className="flex-1">
                <Button className="w-full" variant="secondary">
                  צפה במשתמש
                </Button>
              </Link>
              <Button
                className="flex-1"
                onClick={() => {
                  setResult(null);
                  setFormData({
                    brandName: '',
                    industry: '',
                    website: '',
                    managerDisplayName: '',
                    managerEmail: '',
                    managerPassword: '',
                  });
                }}
              >
                צור מותג נוסף
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f4f5f7] p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="text-sm text-[#6c757d] hover:text-[#f2cc0d] transition-colors"
          >
            ← חזרה לדשבורד
          </Link>
        </div>

        <Card className="p-8">
          <h1 className="text-2xl font-bold text-[#212529] mb-2">צור מותג חדש</h1>
          <p className="text-[#6c757d] mb-8">יצירת חשבון מותג + מנהל מותג חדש</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Brand Details */}
            <div>
              <h2 className="text-lg font-bold text-[#212529] mb-4 pb-2 border-b border-[#dee2e6]">
                פרטי המותג
              </h2>
              <div className="space-y-4">
                <Input
                  label="שם המותג *"
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="שם החברה"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-[#212529] mb-2">
                    תעשייה
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-[#f2cc0d] transition-colors"
                  >
                    <option value="">בחר תעשייה...</option>
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
                  placeholder="example.com"
                />
              </div>
            </div>

            {/* Manager Details */}
            <div>
              <h2 className="text-lg font-bold text-[#212529] mb-4 pb-2 border-b border-[#dee2e6]">
                פרטי מנהל המותג
              </h2>
              <div className="space-y-4">
                <Input
                  label="שם תצוגה *"
                  type="text"
                  value={formData.managerDisplayName}
                  onChange={(e) => setFormData({ ...formData, managerDisplayName: e.target.value })}
                  placeholder="שם מלא"
                  required
                />

                <Input
                  label="אימייל *"
                  type="email"
                  value={formData.managerEmail}
                  onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                  placeholder="manager@brand.com"
                  required
                />

                <div>
                  <Input
                    label="סיסמה *"
                    type="text"
                    value={formData.managerPassword}
                    onChange={(e) => setFormData({ ...formData, managerPassword: e.target.value })}
                    placeholder="סיסמה למנהל"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAutoPassword}
                    className="mt-2 text-sm text-[#f2cc0d] hover:underline"
                  >
                    צור סיסמה אוטומטית
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'יוצר מותג...' : 'צור מותג'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
