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
      title: string;
    };
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

    // Get all approved uploads for this brand
    const { data: uploadsData, error } = await supabase
      .from('uploads')
      .select(`
        id,
        storage_path,
        status,
        created_at,
        meta,
        task_id,
        tasks!inner(
          title,
          campaign_id,
          campaigns!inner(
            title,
            brand_id
          )
        )
      `)
      .eq('tasks.campaigns.brand_id', user?.brand_id!)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading assets:', error);
      setLoading(false);
      return;
    }

    const enriched = (uploadsData || []).map((upload: any) => ({
      upload: {
        id: upload.id,
        storage_path: upload.storage_path,
        status: upload.status,
        created_at: upload.created_at,
        meta: upload.meta,
        task_id: upload.task_id,
      },
      task: {
        title: upload.tasks.title,
        campaign: {
          title: upload.tasks.campaigns.title,
        }
      }
    }));

    setAssets(enriched);
    setLoading(false);
  };

  const filteredAssets = assets.filter((asset) => {
    if (selectedCampaign !== 'all') {
      // Get campaign_id from task
      const taskBelongsToCampaign = campaigns.find(c => c.title === asset.task.campaign.title)?.id;
      if (taskBelongsToCampaign !== selectedCampaign) return false;
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
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">תוכן מאושר</h1>
            <p className="text-[#cbc190]">ספריית תכנים מאושרים להורדה ושימוש</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-4 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
          >
            <option value="all">כל הקמפיינים</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
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
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => (
                <Card key={asset.upload.id} className="overflow-hidden">
                  <div className="space-y-3">
                    {/* Media Preview */}
                    <div className="aspect-square bg-[#2e2a1b] rounded-lg overflow-hidden">
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
                    
                    {/* Details */}
                    <div>
                      <div className="text-white font-medium mb-1 text-sm">
                        {asset.task.title}
                      </div>
                      <div className="text-xs text-[#cbc190] mb-2">
                        {asset.task.campaign.title}
                      </div>
                      {asset.upload.meta?.deliverable_type && (
                        <div className="text-xs text-[#f2cc0d] mb-2">
                          {asset.upload.meta.deliverable_type}
                        </div>
                      )}
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
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-[#cbc190] text-center py-12">
                {assets.length === 0 ? 'אין תוכן מאושר עדיין' : 'לא נמצאו תוצאות לפי הסינון'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
