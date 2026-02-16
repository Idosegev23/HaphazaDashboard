'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const adminEmails = ['cto@ldrsgroup.com', 'yoav@ldrsgroup.com'];

  const handleSetAdmins = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = createClient();

      // Call the RPC function
      const { data, error: rpcError } = await supabase.rpc('set_multiple_admins', {
        user_emails: adminEmails
      });

      if (rpcError) {
        throw rpcError;
      }

      setResult(data);
      alert('✅ משתמשי אדמין הוגדרו בהצלחה!');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'נכשל בהגדרת אדמינים');
      alert('❌ שגיאה: ' + (err.message || 'נכשל בהגדרת אדמינים'));
    } finally {
      setLoading(false);
    }
  };

  const handleFixRLS = async () => {
    setLoading(true);
    setError(null);

    try {
      // This would require running the migration
      alert('⚠️ תיקון RLS דורש הרצת קובץ המיגרציה.\n\nאנא הרץ:\nnpx supabase db push\n\nאו הרץ את ה-SQL מ:\nsupabase/migrations/20260212_fix_campaigns_rls.sql\n\nב-Supabase Dashboard.');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#212529] mb-2">⚙️ הגדרות אדמין</h1>
          <p className="text-[#6c757d]">הגדרת משתמשי אדמין והגדרות מערכת</p>
        </div>

        {/* Set Admins */}
        <Card>
          <h2 className="text-xl font-bold text-[#212529] mb-4">1️⃣ הגדר משתמשי אדמין</h2>
          <p className="text-[#6c757d] mb-4">
            פעולה זו תעניק הרשאות אדמין למשתמשים הבאים:
          </p>
          <ul className="list-disc list-inside mb-6 text-[#212529]">
            {adminEmails.map(email => (
              <li key={email} className="py-1">{email}</li>
            ))}
          </ul>
          
          <Button
            onClick={handleSetAdmins}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'מעבד...' : 'הגדר משתמשי אדמין'}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-bold text-green-700 mb-2">✅ הצלחה!</div>
              <div className="text-sm text-green-600">
                {result.count} משתמש/ים עודכנו
              </div>
              {result.users && (
                <div className="mt-2 space-y-1">
                  {result.users.map((u: any) => (
                    <div key={u.id} className="text-xs text-[#6c757d]">
                      {u.email} → {u.role}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-bold text-red-700 mb-2">❌ שגיאה</div>
              <div className="text-sm text-red-600">{error}</div>
              <div className="mt-3 text-xs text-[#6c757d]">
                <strong>הערה:</strong> אם פונקציית ה-RPC לא קיימת, עליך להריץ את המיגרציה תחילה:
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  npx supabase db push
                </pre>
                או הרץ את ה-SQL מ: <code>supabase/migrations/20260212_create_admin_functions.sql</code>
              </div>
            </div>
          )}
        </Card>

        {/* Fix RLS */}
        <Card>
          <h2 className="text-xl font-bold text-[#212529] mb-4">2️⃣ תיקון RLS קמפיינים</h2>
          <p className="text-[#6c757d] mb-4">
            פעולה זו תעדכן את מדיניות Row Level Security עבור טבלת הקמפיינים כדי לאפשר יצירת קמפיינים.
          </p>
          
          <Button
            onClick={handleFixRLS}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            הצג הוראות
          </Button>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="font-bold text-yellow-800 mb-2">⚠️ נדרש שלב ידני</div>
            <div className="text-sm text-yellow-700 mb-3">
              הרץ מיגרציה זו כדי לתקן מדיניות RLS:
            </div>
            <pre className="text-xs bg-yellow-100 p-3 rounded overflow-x-auto">
              npx supabase db push
            </pre>
            <div className="text-xs text-yellow-600 mt-2">
              או הרץ את ה-SQL מ: <code>supabase/migrations/20260212_fix_campaigns_rls.sql</code>
            </div>
          </div>
        </Card>

        {/* Alternative: Manual SQL */}
        <Card className="bg-blue-50 border-2 border-blue-300">
          <h2 className="text-xl font-bold text-blue-900 mb-4">💡 אלטרנטיבה: הרץ SQL ידנית</h2>
          <p className="text-blue-700 mb-4">
            אם הנ"ל לא עובד, הרץ SQL זה ישירות ב-Supabase Dashboard → SQL Editor:
          </p>
          <pre className="text-xs bg-blue-100 p-4 rounded overflow-x-auto text-blue-900">
{`-- Set admin users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- Fix campaigns RLS
DROP POLICY IF EXISTS "Brands can insert their own campaigns" ON campaigns;
CREATE POLICY "Enable insert for authenticated users" ON campaigns
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable read for authenticated users" ON campaigns
  FOR SELECT TO authenticated USING (true);`}
          </pre>
        </Card>
      </div>
    </div>
  );
}
