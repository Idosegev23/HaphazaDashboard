'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Upload = {
  id: string;
  storage_path: string;
  status: string;
  created_at: string;
  meta: any;
  task_id: string;
};

type Asset = {
  upload: Upload;
  task: {
    title: string;
    campaign: {
      id: string;
      title: string;
    };
    creator: {
      display_name: string;
      avatar_url: string | null;
      platforms: any;
    } | null;
  };
};

export default function BrandAssetsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.brand_id) return;
    loadAssets();
    loadCampaigns();
  }, [user?.brand_id, userLoading]);

  const loadCampaigns = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('campaigns')
      .select('id, title')
      .eq('brand_id', user?.brand_id!)
      .order('created_at', { ascending: false });
    
    setCampaigns(data || []);
  };

  const loadAssets = async () => {
    const supabase = createClient();

    try {
      // Step 1: Get all campaigns for this brand
      const { data: brandCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('brand_id', user?.brand_id!);

      if (campaignsError) throw campaignsError;
      
      if (!brandCampaigns || brandCampaigns.length === 0) {
        console.log('No campaigns found for brand');
        setAssets([]);
        setLoading(false);
        return;
      }

      const campaignIds = brandCampaigns.map(c => c.id);

      // Step 2: Get all tasks for these campaigns
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, campaign_id, creator_id, campaigns!inner(id, title)')
        .in('campaign_id', campaignIds);

      if (tasksError) throw tasksError;
      
      if (!tasksData || tasksData.length === 0) {
        console.log('No tasks found for campaigns');
        setAssets([]);
        setLoading(false);
        return;
      }

      const taskIds = tasksData.map(t => t.id);
      const tasksMap = new Map(tasksData.map(t => [t.id, t]));

      // Step 3: Get all approved uploads for these tasks
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('uploads')
        .select('*')
        .in('task_id', taskIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      if (!uploadsData || uploadsData.length === 0) {
        console.log('No approved uploads found');
        setAssets([]);
        setLoading(false);
        return;
      }

      // Step 4: Enrich with creator data
      const creatorIds = [...new Set(uploadsData.map(u => {
        const task = tasksMap.get(u.task_id);
        return task?.creator_id;
      }).filter((id): id is string => Boolean(id)))];

      const { data: profilesData } = await supabase
        .from('users_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', creatorIds as string[]);

      const { data: creatorsData } = await supabase
        .from('creators')
        .select('user_id, platforms')
        .in('user_id', creatorIds as string[]);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const creatorsMap = new Map(creatorsData?.map(c => [c.user_id, c]) || []);

      // Step 5: Combine everything
      const enriched = uploadsData.map((upload: any) => {
        const task = tasksMap.get(upload.task_id);
        if (!task) return null;

        const profile = profilesMap.get(task.creator_id);
        const creator = creatorsMap.get(task.creator_id);

        return {
          upload: {
            id: upload.id,
            storage_path: upload.storage_path,
            status: upload.status,
            created_at: upload.created_at,
            meta: upload.meta,
            task_id: upload.task_id,
          },
          task: {
            title: task.title,
            campaign: {
              id: task.campaigns.id,
              title: task.campaigns.title,
            },
            creator: profile && creator ? {
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              platforms: creator.platforms,
            } : null
          }
        };
      }).filter(Boolean);

      console.log(`Loaded ${enriched.length} approved assets`);
      setAssets(enriched as Asset[]);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      alert('שגיאה בטעינת תכנים: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (selectedCampaign !== 'all') {
      if (asset.task.campaign.id !== selectedCampaign) return false;
    }
    
    if (selectedType !== 'all') {
      const isImage = asset.upload.meta?.type?.startsWith('image/');
      const isVideo = asset.upload.meta?.type?.startsWith('video/');
      if (selectedType === 'image' && !isImage) return false;
      if (selectedType === 'video' && !isVideo) return false;
    }
    
    return true;
  });

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mb-2">תוכן מאושר</h1>
            <p className="text-[#6c757d]">ספריית תכנים מאושרים להורדה ושימוש</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-4 py-2 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold"
          >
            <option value="all">כל הקמפיינים</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold"
          >
            <option value="all">כל הסוגים</option>
            <option value="image">תמונות</option>
            <option value="video">סרטונים</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredAssets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => {
                // Extract first social link if available
                const platforms = asset.task.creator?.platforms as Record<string, any> | null;
                const firstPlatform = platforms ? Object.entries(platforms)[0] : null;
                const socialLink = firstPlatform 
                  ? firstPlatform[0] === 'instagram' 
                    ? `https://instagram.com/${firstPlatform[1]?.username}`
                    : firstPlatform[0] === 'tiktok'
                    ? `https://tiktok.com/@${firstPlatform[1]?.username}`
                    : firstPlatform[1]?.url || '#'
                  : null;

                return (
                  <Card key={asset.upload.id} className="overflow-hidden">
                    <div className="space-y-3">
                      {/* Media Preview */}
                      <div className="aspect-square bg-[#f8f9fa] rounded-lg overflow-hidden">
                        {asset.upload.meta?.type?.startsWith('image/') ? (
                          <img
                            src={`/api/storage/task-uploads/${asset.upload.storage_path}`}
                            alt={asset.task.title}
                            className="w-full h-full object-cover"
                          />
                        ) : asset.upload.meta?.type?.startsWith('video/') ? (
                          <video
                            src={`/api/storage/task-uploads/${asset.upload.storage_path}`}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            📄
                          </div>
                        )}
                      </div>
                      
                      {/* Creator Info */}
                      {asset.task.creator && (
                        <div className="flex items-center gap-3 pb-3 border-b border-[#dee2e6]">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#f8f9fa] border-2 border-[#f2cc0d] flex-shrink-0">
                            {asset.task.creator.avatar_url ? (
                              <img 
                                src={asset.task.creator.avatar_url} 
                                alt={asset.task.creator.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg text-[#f2cc0d]">
                                👤
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[#212529] font-medium text-sm truncate">
                              {asset.task.creator.display_name}
                            </div>
                            {socialLink && (
                              <a 
                                href={socialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#f2cc0d] hover:text-[#d4b00b] text-xs"
                              >
                                🔗 פרופיל
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Content Details */}
                      <div>
                        <div className="text-[#212529] font-medium mb-1 text-sm">
                          {asset.upload.meta?.deliverable_type ? (
                            <span className="inline-block px-2 py-1 bg-[#f2cc0d] text-black text-xs font-bold rounded mb-2">
                              {asset.upload.meta.deliverable_type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-[#6c757d] text-xs">סוג תוכן לא צוין</span>
                          )}
                        </div>
                        <div className="text-[#212529] font-medium mb-1 text-sm">
                          {asset.task.title}
                        </div>
                        <div className="text-xs text-[#6c757d] mb-1">
                          📋 {asset.task.campaign.title}
                        </div>
                        <div className="text-xs text-[#6c757d]">
                          📅 {new Date(asset.upload.created_at).toLocaleDateString('he-IL')}
                        </div>
                      </div>

                      {/* Actions */}
                      <a
                        href={`/api/storage/task-uploads/${asset.upload.storage_path}`}
                        download
                        className="block w-full text-center px-4 py-2 bg-[#f2cc0d] text-black font-medium rounded-lg hover:bg-[#d4b00b] transition-colors text-sm"
                      >
                        ⬇️ הורד
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <p className="text-[#6c757d] text-center py-12">
                {assets.length === 0 ? 'אין תוכן מאושר עדיין' : 'לא נמצאו תוצאות לפי הסינון'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
