import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default async function BrandApplicationsPage() {
  const user = await getUser();
  
  if (!user || !['brand_manager', 'brand_user'].includes(user.role || '')) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get all applications
  const { data: applications } = await supabase
    .from('applications')
    .select('*, campaigns!inner(title, brand_id), creators(user_id, niches, platforms, country)')
    .eq('campaigns.brand_id', user.brand_id!)
    .order('created_at', { ascending: false });

  const statusLabels: Record<string, string> = {
    submitted: 'ממתין',
    approved: 'אושר',
    rejected: 'נדחה',
  };

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">בקשות משימתים</h1>
          <p className="text-[#cbc190]">סקירה ואישור יוצרי תוכן</p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <Link key={application.id} href={`/brand/applications/${application.id}`}>
                <Card hover className="relative">
                  <div className={`status-stripe ${statusColors[application.status || 'submitted']}`} />
                  <div className="pl-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">
                          {/* @ts-ignore */}
                          {application.campaigns?.title}
                        </h3>
                        <div className="text-sm text-[#cbc190] mb-3">
                          {/* @ts-ignore */}
                          נישות: {application.creators?.niches?.join(', ') || 'לא צוין'}
                        </div>
                        {application.message && (
                          <p className="text-[#cbc190] text-sm line-clamp-2">{application.message}</p>
                        )}
                      </div>
                      <div className="text-sm text-[#f2cc0d]">
                        {statusLabels[application.status || 'submitted']}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-[#cbc190] text-center py-8">אין בקשות עדיין</p>
          </Card>
        )}
      </div>
    </div>
  );
}
