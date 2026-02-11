'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Application = {
  id: string;
  message: string | null;
  availability: string | null;
  portfolio_links: string | null;
  status: string;
  campaigns: {
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
    availability: '',
    portfolio_links: '',
  });

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data, error } = await supabase
      .from('applications')
      .select('id, message, availability, portfolio_links, status, campaigns(title, brands(name))')
      .eq('id', applicationId)
      .eq('creator_id', user.id) // Ensure creator can only edit their own applications
      .single();

    if (error || !data) {
      alert('לא נמצאה בקשה או שאין לך הרשאה לערוך אותה');
      router.push('/creator/applications');
      return;
    }

    // Check if application can be edited (only submitted status)
    if (data.status !== 'submitted') {
      alert('ניתן לערוך רק בקשות שטרם אושרו או נדחו');
      router.push('/creator/applications');
      return;
    }

    setApplication(data as Application);
    setFormData({
      message: data.message || '',
      availability: data.availability || '',
      portfolio_links: data.portfolio_links || '',
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      alert('יש למלא הודעה למותג');
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          message: formData.message,
          availability: formData.availability,
          portfolio_links: formData.portfolio_links,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Audit log
      await supabase.rpc('log_audit', {
        p_entity: 'application',
        p_entity_id: applicationId,
        p_action: 'updated',
        p_metadata: { updated_fields: ['message', 'availability', 'portfolio_links'] }
      });

      alert('✅ הבקשה עודכנה בהצלחה!');
      router.push('/creator/applications');
    } catch (error: any) {
      console.error('Error updating application:', error);
      alert('שגיאה בעדכון הבקשה: ' + error.message);
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
        <div className="text-white text-xl">בקשה לא נמצאה</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← חזרה
        </Button>

        <Card>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">עריכת מועמדות</h1>
            <div className="flex items-center gap-2 text-[#cbc190]">
              <span>קמפיין:</span>
              <span className="font-medium text-white">{application.campaigns?.title}</span>
              <span>•</span>
              <span>{application.campaigns?.brands?.name}</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-white font-bold mb-1">טיפ לעריכה</h3>
                <p className="text-blue-200 text-sm">
                  ניתן לערוך את הבקשה רק כל עוד היא במצב "ממתין לאישור". 
                  לאחר אישור או דחייה, לא ניתן יהיה לערוך את הבקשה.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                הודעה למותג *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="ספר/י למה את/ה מתאים/ה לקמפיין הזה..."
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white placeholder:text-[#6b6542] focus:outline-none focus:border-[#f2cc0d] transition-colors min-h-[120px] resize-y"
                required
              />
              <p className="text-[#cbc190] text-sm mt-1">
                תאר/י את הניסיון שלך, למה את/ה מתאים/ה, ומה ייחודי בתוכן שלך
              </p>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                זמינות
              </label>
              <Input
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder='למשל: "זמין/ה החל מ-15.2" או "זמין/ה מיידית"'
              />
              <p className="text-[#cbc190] text-sm mt-1">
                מתי תוכל/י להתחיל לעבוד על הקמפיין?
              </p>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                קישורים לתיק עבודות
              </label>
              <textarea
                value={formData.portfolio_links}
                onChange={(e) => setFormData({ ...formData, portfolio_links: e.target.value })}
                placeholder="הוסף/י קישורים לעבודות קודמות (אחד בכל שורה)"
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white placeholder:text-[#6b6542] focus:outline-none focus:border-[#f2cc0d] transition-colors min-h-[100px] resize-y"
              />
              <p className="text-[#cbc190] text-sm mt-1">
                קישורים לתכנים שיצרת בעבר (Instagram, TikTok, וכו')
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'שומר...' : '💾 שמור שינויים'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => router.back()}
                disabled={saving}
              >
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
