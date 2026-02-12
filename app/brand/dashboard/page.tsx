import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

export default async function BrandDashboardPage() {
  const user = await getUser();
  
  if (!user || !['brand_manager', 'brand_user'].includes(user.role || '')) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get brand info
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', user.brand_id!)
    .single();

  // Get stats
  const { count: campaignsCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', user.brand_id!);

  const { count: activeCampaignsCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', user.brand_id!)
    .eq('status', 'open');

  const { count: applicationsCount } = await supabase
    .from('applications')
    .select('campaign_id, campaigns!inner(brand_id)', { count: 'exact', head: true })
    .eq('campaigns.brand_id', user.brand_id!)
    .eq('status', 'submitted');

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#212529] mb-2">
              {brand?.name}
            </h1>
            <p className="text-muted">לוח בקרה</p>
          </div>
          <Link href="/brand/campaigns/new">
            <Button>קמפיין חדש +</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-muted text-sm mb-2">סה"כ קמפיינים</div>
            <div className="text-3xl font-bold text-gold">{campaignsCount || 0}</div>
          </Card>
          <Link href="/brand/campaigns" className="block">
            <Card hover>
              <div className="text-muted text-sm mb-2">קמפיינים פעילים</div>
              <div className="text-3xl font-bold text-gold">{activeCampaignsCount || 0}</div>
              <div className="text-xs text-muted mt-2">לחץ לצפייה ←</div>
            </Card>
          </Link>
          <Link href="/brand/applications" className="block">
            <Card hover>
              <div className="text-muted text-sm mb-2">בקשות ממתינות</div>
              <div className="text-3xl font-bold text-gold">{applicationsCount || 0}</div>
              <div className="text-xs text-muted mt-2">לחץ לצפייה ←</div>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-bold text-[#212529] mb-4">פעולות מהירות</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/brand/campaigns/new">
              <div className="glass-panel-hover p-6 rounded-lg text-center">
                
                <div className="text-[#212529] font-medium">קמפיין חדש</div>
              </div>
            </Link>
            <Link href="/brand/applications">
              <div className="glass-panel-hover p-6 rounded-lg text-center">
                
                <div className="text-[#212529] font-medium">סקירת בקשות</div>
              </div>
            </Link>
            <Link href="/brand/assets">
              <div className="glass-panel-hover p-6 rounded-lg text-center">
                
                <div className="text-[#212529] font-medium">תוכן מאושר</div>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      <TutorialPopup tutorialKey="brand_dashboard" />
    </div>
  );
}
