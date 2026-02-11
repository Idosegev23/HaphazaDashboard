'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

type ApplicationsTabProps = {
  campaignId: string;
};

type Application = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  creators: {
    user_id: string;
    niches: string[] | null;
    platforms: any;
    age: number | null;
    gender: string | null;
    users_profiles: {
      display_name: string;
      email: string;
      avatar_url: string | null;
    } | null;
  } | null;
};

export function ApplicationsTab({ campaignId }: ApplicationsTabProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadApplications();
  }, [campaignId]);

  const loadApplications = async () => {
    const supabase = createClient();

    const { data: appsData, error } = await supabase
      .from('applications')
      .select('id, status, message, created_at, creator_id')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading applications:', error);
      setLoading(false);
      return;
    }

    // Load creator details
    const enrichedData = await Promise.all(
      (appsData || []).map(async (app: any) => {
        const { data: creatorData } = await supabase
          .from('creators')
          .select('user_id, niches, platforms, age_range, gender')
          .eq('user_id', app.creator_id)
          .single();

        const { data: profileData } = await supabase
          .from('users_profiles')
          .select('display_name, email, avatar_url')
          .eq('user_id', app.creator_id)
          .single();

        return {
          ...app,
          creators: creatorData
            ? {
                user_id: creatorData.user_id,
                niches: creatorData.niches,
                platforms: creatorData.platforms,
                age: (creatorData as any).age_range, // Using age_range temporarily
                gender: creatorData.gender,
                users_profiles: profileData,
              }
            : null,
        };
      })
    );

    setApplications(enrichedData as any);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-xl">טוען מועמדויות...</div>
      </div>
    );
  }

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

  const filteredApplications =
    statusFilter === 'all'
      ? applications
      : applications.filter((app) => app.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">👥 משפיענים</h2>
          <p className="text-[#cbc190] text-sm">
            {filteredApplications.length} מועמדויות
            {statusFilter !== 'all' && ` (${statusLabels[statusFilter]})`}
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#2e2a1b] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="submitted">ממתין ({applications.filter((a) => a.status === 'submitted').length})</option>
          <option value="approved">אושר ({applications.filter((a) => a.status === 'approved').length})</option>
          <option value="rejected">נדחה ({applications.filter((a) => a.status === 'rejected').length})</option>
        </select>
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const platforms = application.creators?.platforms as Record<string, any> | null;
            const firstPlatform = platforms ? Object.entries(platforms)[0] : null;
            const socialLink = firstPlatform
              ? firstPlatform[0] === 'instagram'
                ? `https://instagram.com/${firstPlatform[1]?.username}`
                : firstPlatform[0] === 'tiktok'
                ? `https://tiktok.com/@${firstPlatform[1]?.username}`
                : firstPlatform[1]?.url || '#'
              : null;

            return (
              <Link key={application.id} href={`/brand/applications/${application.id}`}>
                <Card hover className="relative">
                  <div className={`status-stripe ${statusColors[application.status || 'submitted']}`} />
                  <div className="pl-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-[#2e2a1b] border-2 border-[#f2cc0d]">
                          {application.creators?.users_profiles?.avatar_url ? (
                            <img
                              src={application.creators.users_profiles.avatar_url}
                              alt={application.creators.users_profiles.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-[#f2cc0d]">
                              👤
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-white font-bold text-lg">
                              {application.creators?.users_profiles?.display_name || 'לא זמין'}
                            </span>
                            {socialLink && (
                              <a
                                href={socialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#f2cc0d] hover:text-[#d4b00b] text-xs ml-2"
                              >
                                🔗 פרופיל
                              </a>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                              statusColors[application.status || 'submitted']
                            }`}
                          >
                            {statusLabels[application.status || 'submitted']}
                          </span>
                        </div>

                        <div className="text-sm text-[#cbc190] mb-2 space-y-1">
                          {application.creators?.age && (
                            <div>
                              <span>גיל {application.creators.age}</span>
                              {application.creators?.gender && (
                                <span>
                                  {' '}
                                  •{' '}
                                  {application.creators.gender === 'female'
                                    ? 'נקבה'
                                    : application.creators.gender === 'male'
                                    ? 'זכר'
                                    : 'אחר'}
                                </span>
                              )}
                            </div>
                          )}
                          <div>🏷️ {application.creators?.niches?.join(', ') || 'לא צוין'}</div>
                        </div>

                        {application.message && (
                          <p className="text-[#cbc190] text-sm line-clamp-2 italic">
                            "{application.message}"
                          </p>
                        )}

                        <div className="text-xs text-[#cbc190] mt-2">
                          נשלח ב-{new Date(application.created_at).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-[#cbc190] text-center py-8">
            {applications.length === 0
              ? 'עדיין לא התקבלו מועמדויות לקמפיין זה'
              : 'לא נמצאו מועמדויות בסטטוס זה'}
          </p>
        </Card>
      )}
    </div>
  );
}
