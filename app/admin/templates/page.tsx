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
          <h1 className="text-3xl font-bold text-white mb-2">Templates & Localization</h1>
          <p className="text-[#cbc190]">Manage system templates and translations</p>
        </div>

        {/* Templates */}
        <Card className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Templates</h2>
          {templates && templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="p-4 bg-[#2e2a1b] rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{template.key}</div>
                      <div className="text-sm text-[#cbc190]">Type: {template.type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#cbc190] text-center py-4">No templates yet</p>
          )}
        </Card>

        {/* i18n Strings */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Localization Strings (Sample)</h2>
          {i18nStrings && i18nStrings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-[#494222]">
                    <th className="pb-3 text-[#cbc190]">Namespace</th>
                    <th className="pb-3 text-[#cbc190]">Key</th>
                    <th className="pb-3 text-[#cbc190]">Hebrew</th>
                    <th className="pb-3 text-[#cbc190]">English</th>
                  </tr>
                </thead>
                <tbody>
                  {i18nStrings.map((str) => (
                    <tr key={str.id} className="border-b border-[#494222]">
                      <td className="py-3 text-white text-sm">{str.namespace}</td>
                      <td className="py-3 text-white text-sm">{str.key}</td>
                      <td className="py-3 text-[#cbc190] text-sm">{str.he || '-'}</td>
                      <td className="py-3 text-[#cbc190] text-sm">{str.en || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#cbc190] text-center py-4">No localization strings yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
