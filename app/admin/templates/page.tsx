import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';

export default async function AdminTemplatesPage() {
  const user = await getUser();
  
  if (!user || !['admin', 'content_ops'].includes(user.role || '')) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get templates
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  // Get i18n strings
  const { data: i18nStrings } = await supabase
    .from('i18n_strings')
    .select('*')
    .order('namespace', { ascending: true })
    .limit(20);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#212529] mb-2">📝 תבניות ותרגומים</h1>
          <p className="text-[#6c757d]">ניהול תבניות מערכת ותרגומים</p>
        </div>

        {/* Templates */}
        <Card className="mb-8">
          <h2 className="text-xl font-bold text-[#212529] mb-4">תבניות</h2>
          {templates && templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="p-4 bg-[#f8f9fa] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#212529] font-medium">{template.key}</div>
                      <div className="text-sm text-[#6c757d]">סוג: {template.type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6c757d] text-center py-4">אין תבניות עדיין</p>
          )}
        </Card>

        {/* i18n Strings */}
        <Card>
          <h2 className="text-xl font-bold text-[#212529] mb-4">מחרוזות תרגום (דוגמה)</h2>
          {i18nStrings && i18nStrings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-right border-b border-[#dee2e6]">
                    <th className="pb-3 text-[#6c757d]">מרחב שמות</th>
                    <th className="pb-3 text-[#6c757d]">מפתח</th>
                    <th className="pb-3 text-[#6c757d]">עברית</th>
                    <th className="pb-3 text-[#6c757d]">אנגלית</th>
                  </tr>
                </thead>
                <tbody>
                  {i18nStrings.map((str) => (
                    <tr key={str.id} className="border-b border-[#dee2e6]">
                      <td className="py-3 text-[#212529] text-sm text-right">{str.namespace}</td>
                      <td className="py-3 text-[#212529] text-sm text-right">{str.key}</td>
                      <td className="py-3 text-[#6c757d] text-sm text-right">{str.he || '-'}</td>
                      <td className="py-3 text-[#6c757d] text-sm text-right">{str.en || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#6c757d] text-center py-4">אין מחרוזות תרגום עדיין</p>
          )}
        </Card>
      </div>
    </div>
  );
}
