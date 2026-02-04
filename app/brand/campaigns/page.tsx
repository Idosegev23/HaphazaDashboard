import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function BrandCampaignsPage() {
  const user = await getUser();
  
  if (!user || !['brand_manager', 'brand_user'].includes(user.role || '')) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get all campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('brand_id', user.brand_id!)
    .order('created_at', { ascending: false });

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    open: 'פתוח',
    closed: 'סגור',
    archived: 'בארכיון',
  };

  const statusColors: Record<string, string> = {
    draft: 'text-gray-400',
    open: 'text-green-400',
    closed: 'text-blue-400',
    archived: 'text-gray-500',
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">הקמפיינים שלי</h1>
            <p className="text-[#cbc190]">ניהול וניטור קמפיינים</p>
          </div>
          <Link href="/brand/campaigns/new">
            <Button>קמפיין חדש +</Button>
          </Link>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/brand/campaigns/${campaign.id}`}>
                <Card hover className="h-full">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
                        <span className={`text-sm ${statusColors[campaign.status || 'draft']}`}>
                          {statusLabels[campaign.status || 'draft']}
                        </span>
                      </div>
                      {campaign.concept && (
                        <p className="text-[#cbc190] text-sm line-clamp-2">{campaign.concept}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#494222]">
                      <div className="text-[#f2cc0d] font-bold">
                        {campaign.fixed_price
                          ? `₪${campaign.fixed_price.toLocaleString()}`
                          : 'מחיר לא הוגדר'}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <p className="text-[#cbc190] mb-4">עדיין לא יצרת קמפיינים</p>
              <Link href="/brand/campaigns/new">
                <Button>צור את הקמפיין הראשון</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
