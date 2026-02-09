'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Application = {
  id: string;
  message: string | null;
  portfolio_links: any;
  availability: string | null;
  status: string | null;
  campaigns: {
    id: string;
    title: string;
    brands: {
      name: string;
    } | null;
  } | null;
};

export default function EditApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    message: '',
    portfolio_links: '',
    availability: '',
  });

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Load application
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        message,
        portfolio_links,
        availability,
        status,
        campaigns(id, title, brands(name))
      `)
      .eq('id', applicationId)
      .eq('creator_id', user.id)
      .single();

    if (error || !data) {
      alert('❌ מועמדות לא נמצאה');
      router.push('/creator/applications');
      return;
    }

    // Check if application is editable (only submitted status)
    if (data.status !== 'submitted') {
      alert('⚠️ ניתן לערוך רק מועמדויות בסטטוס "ממתין לאישור"');
      router.push('/creator/applications');
      return;
    }

    setApplication(data as Application);
    setFormData({
      message: data.message || '',
      portfolio_links: Array.isArray(data.portfolio_links) 
        ? data.portfolio_links.join('\n') 
        : (typeof data.portfolio_links === 'string' ? data.portfolio_links : ''),
      availability: data.availability || '',
    });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      // Parse portfolio links
      const linksArray = formData.portfolio_links
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0);

      const { error } = await supabase
        .from('applications')
        .update({
          message: formData.message,
          portfolio_links: linksArray,
          availability: formData.availability,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      alert('✅ המועמדות עודכנה בהצלחה');
      router.push('/creator/applications');
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert(`❌ שגיאה בעדכון המועמדות: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">מועמדות לא נמצאה</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/creator/applications')}
            className="text-[#cbc190] hover:text-[#f2cc0d] transition-colors"
          >
            ← חזרה
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">ערוך מועמדות</h1>
        </div>
        <p className="text-[#cbc190]">
          קמפיין: {application.campaigns?.title} • {application.campaigns?.brands?.name}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">edit</span>
              פרטי המועמדות
            </h2>

            <div className="space-y-4">
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  הודעה למותג
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="ספר למותג למה אתה מתאים לקמפיין, מה הניסיון שלך, וכו'..."
                  rows={5}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors resize-none"
                />
                <p className="text-xs text-[#cbc190] mt-1">
                  הודעה זו תוצג למותג יחד עם המועמדות שלך
                </p>
              </div>

              {/* Portfolio Links */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  קישורים לתיק עבודות
                </label>
                <textarea
                  value={formData.portfolio_links}
                  onChange={(e) => setFormData({ ...formData, portfolio_links: e.target.value })}
                  placeholder="https://instagram.com/post/123&#10;https://tiktok.com/@user/video/456&#10;https://youtube.com/watch?v=789"
                  rows={4}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors resize-none font-mono text-sm"
                />
                <p className="text-xs text-[#cbc190] mt-1">
                  כל קישור בשורה נפרדת. הוסף קישורים לתוכן רלוונטי שיצרת
                </p>
              </div>

              {/* Availability */}
              <Input
                label="זמינות"
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="למשל: זמין מיד, זמין בעוד שבוע, וכו'"
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.message.trim()}
                  className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </Button>
                <Button
                  onClick={() => router.push('/creator/applications')}
                  className="bg-[#2e2a1b] hover:bg-[#3a3525]"
                >
                  ביטול
                </Button>
              </div>

              {formData.message.trim().length === 0 && (
                <p className="text-yellow-500 text-sm">
                  ⚠️ חובה למלא הודעה למותג
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
