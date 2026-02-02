import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';

export default async function BrandAssetsPage() {
  const user = await getUser();
  
  if (!user || !['brand_manager', 'brand_user'].includes(user.role || '')) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get approved assets
  const { data: assets } = await supabase
    .from('approved_assets')
    .select('*, tasks(title, campaigns!inner(brand_id, title), creators(niches))')
    .eq('tasks.campaigns.brand_id', user.brand_id!)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">תוכן מאושר</h1>
          <p className="text-[#cbc190]">ספריית תכנים מאושרים לשימוש</p>
        </div>

        {assets && assets.length > 0 ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <div className="space-y-3">
                  <div className="aspect-square bg-[#2e2a1b] rounded-lg flex items-center justify-center text-4xl">
                    🎬
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">
                      {/* @ts-ignore */}
                      {asset.tasks?.title}
                    </div>
                    <div className="text-sm text-[#cbc190]">
                      {/* @ts-ignore */}
                      {asset.tasks?.campaigns?.title}
                    </div>
                  </div>
                  <div className="text-xs text-[#f2cc0d]">
                    {asset.usage_type === 'organic' ? 'אורגני' : 'פרסום ממומן'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-[#cbc190] text-center py-12">אין תוכן מאושר עדיין</p>
          </Card>
        )}
      </div>
    </div>
  );
}
