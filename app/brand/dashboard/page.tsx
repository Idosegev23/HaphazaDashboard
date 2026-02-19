import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TutorialPopup } from '@/components/ui/TutorialPopup';
import { DashboardProfileCard } from '@/components/brand/dashboard/DashboardProfileCard';
import { DashboardStatCard } from '@/components/brand/dashboard/DashboardStatCard';
import { DashboardQuickActions } from '@/components/brand/dashboard/DashboardQuickActions';
import { DashboardCreatorNetwork } from '@/components/brand/dashboard/DashboardCreatorNetwork';
import { DashboardHeroSection } from '@/components/brand/dashboard/DashboardHeroSection';

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

  // Get stats in parallel
  const [
    { count: campaignsCount },
    { count: activeCampaignsCount },
    { count: applicationsCount },
  ] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', user.brand_id!),
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', user.brand_id!)
      .eq('status', 'open'),
    supabase
      .from('applications')
      .select('campaign_id, campaigns!inner(brand_id)', { count: 'exact', head: true })
      .eq('campaigns.brand_id', user.brand_id!)
      .eq('status', 'submitted'),
  ]);

  // Get creators who worked with this brand (for network visualization)
  const { data: brandCreators } = await supabase
    .from('applications')
    .select('profiles:user_id(display_name, avatar_url), campaigns!inner(brand_id)')
    .eq('campaigns.brand_id', user.brand_id!)
    .eq('status', 'approved')
    .limit(10);

  const creators = (brandCreators || [])
    .map((app: any) => app.profiles)
    .filter(Boolean)
    // Deduplicate by display_name
    .filter((c: any, i: number, arr: any[]) =>
      arr.findIndex((x: any) => x.display_name === c.display_name) === i
    )
    .slice(0, 8);

  const roleLabel = user.role === 'brand_manager' ? 'מנהל מותג' : 'משתמש מותג';

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f4f5f7] p-4 md:p-6">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1 (rightmost in RTL): Quick Actions + Creator Network */}
          <div className="flex flex-col gap-5">
            <DashboardQuickActions />
            <DashboardCreatorNetwork creators={creators} />
          </div>

          {/* Column 2 (center): 3 Stat Cards stacked */}
          <div className="flex flex-col gap-5">
            <DashboardStatCard
              label="בקשות ממתינות"
              value={applicationsCount || 0}
              href="/brand/applications"
            />
            <DashboardStatCard
              label="קמפיינים פעילים"
              value={activeCampaignsCount || 0}
              href="/brand/campaigns"
            />
            <DashboardStatCard
              label='סה"כ קמפיינים'
              value={campaignsCount || 0}
              href="/brand/campaigns"
            />
          </div>

          {/* Column 3 (leftmost in RTL): Profile Card + Hero Section */}
          <div className="flex flex-col gap-5">
            <DashboardProfileCard
              displayName={brand?.name || user.profile?.display_name || ''}
              role={roleLabel}
            />
            <DashboardHeroSection />
          </div>
        </div>
      </div>

      <TutorialPopup
        tutorialKey="brand_dashboard"
        buttonClassName="bg-[#ef767a] text-white hover:brightness-90"
      />
    </div>
  );
}
