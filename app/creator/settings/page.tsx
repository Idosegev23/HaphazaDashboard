'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Platform = {
  username: string;
  followers?: number;
  url?: string;
};

type Platforms = {
  instagram?: Platform;
  tiktok?: Platform;
  youtube?: Platform;
  facebook?: Platform;
};

export default function CreatorSettingsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profile, setProfile] = useState({
    display_name: '',
    avatar_url: '',
  });

  const [platforms, setPlatforms] = useState<Platforms>({
    instagram: { username: '', followers: 0 },
    tiktok: { username: '', followers: 0 },
    youtube: { username: '', followers: 0 },
    facebook: { username: '', followers: 0 },
  });

  useEffect(() => {
    if (user && user.role !== 'creator') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) return;
    loadProfile();
  }, [user, userLoading]);

  const loadProfile = async () => {
    const supabase = createClient();

    // Load user profile
    const { data: profileData } = await supabase
      .from('users_profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user!.id)
      .single();

    if (profileData) {
      setProfile({
        display_name: profileData.display_name || '',
        avatar_url: profileData.avatar_url || '',
      });
    }

    // Load creator platforms
    const { data: creatorData } = await supabase
      .from('creators')
      .select('platforms')
      .eq('user_id', user!.id)
      .single();

    if (creatorData?.platforms) {
      const platformsData = creatorData.platforms as Record<string, any>;
      setPlatforms({
        instagram: platformsData.instagram || { username: '', followers: 0 },
        tiktok: platformsData.tiktok || { username: '', followers: 0 },
        youtube: platformsData.youtube || { username: '', followers: 0 },
        facebook: platformsData.facebook || { username: '', followers: 0 },
      });
    }

    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('אנא בחר קובץ תמונה');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('גודל התמונה חייב להיות עד 2MB');
      return;
    }

    setUploadingAvatar(true);
    const supabase = createClient();

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('users_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user!.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: avatarUrl });
      alert('✅ התמונה עודכנה בהצלחה');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(`❌ שגיאה בהעלאת התמונה: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('users_profiles')
        .update({
          display_name: profile.display_name,
        })
        .eq('user_id', user!.id);

      if (profileError) throw profileError;

      alert('✅ הפרופיל עודכן בהצלחה');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(`❌ שגיאה בשמירת הפרופיל: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlatforms = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      // Clean up empty platforms
      const cleanPlatforms: Platforms = {};
      Object.entries(platforms).forEach(([key, value]) => {
        if (value.username && value.username.trim()) {
          cleanPlatforms[key as keyof Platforms] = {
            username: value.username.trim(),
            followers: value.followers || 0,
            url: value.url,
          };
        }
      });

      // Update platforms
      const { error: platformError } = await supabase
        .from('creators')
        .update({ platforms: cleanPlatforms })
        .eq('user_id', user!.id);

      if (platformError) throw platformError;

      alert('✅ פלטפורמות עודכנו בהצלחה');
    } catch (error: any) {
      console.error('Error saving platforms:', error);
      alert(`❌ שגיאה בשמירת הפלטפורמות: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">הגדרות</h1>
        <p className="text-[#cbc190]">ערוך את הפרופיל והקישורים החברתיים שלך</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Section */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">account_circle</span>
              פרופיל
            </h2>

            <div className="space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  תמונת פרופיל
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#2e2a1b] border-2 border-[#f2cc0d] flex-shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl text-[#f2cc0d]">
                        <span className="material-symbols-outlined text-4xl">person</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <span className="inline-block px-4 py-2 bg-[#f2cc0d] text-black font-medium rounded-lg hover:bg-[#d4b00b] transition-colors">
                        {uploadingAvatar ? 'מעלה...' : 'העלה תמונה'}
                      </span>
                    </label>
                    <p className="text-xs text-[#cbc190] mt-1">
                      JPG, PNG או GIF. מקסימום 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <Input
                label="שם תצוגה"
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="השם שיוצג במערכת"
              />

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
              >
                {saving ? 'שומר...' : 'שמור פרופיל'}
              </Button>
            </div>
          </Card>

          {/* Social Platforms Section */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">share</span>
              קישורים חברתיים
            </h2>

            <div className="space-y-4">
              {/* Instagram */}
              <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📷</span>
                  <h3 className="text-white font-medium">Instagram</h3>
                </div>
                <div className="grid gap-3">
                  <Input
                    label="שם משתמש"
                    type="text"
                    value={platforms.instagram?.username || ''}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        instagram: {
                          ...platforms.instagram,
                          username: e.target.value,
                        } as Platform,
                      })
                    }
                    placeholder="username"
                  />
                  <Input
                    label="מספר עוקבים"
                    type="number"
                    value={platforms.instagram?.followers || 0}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        instagram: {
                          ...platforms.instagram,
                          followers: parseInt(e.target.value) || 0,
                        } as Platform,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* TikTok */}
              <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🎵</span>
                  <h3 className="text-white font-medium">TikTok</h3>
                </div>
                <div className="grid gap-3">
                  <Input
                    label="שם משתמש"
                    type="text"
                    value={platforms.tiktok?.username || ''}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        tiktok: {
                          ...platforms.tiktok,
                          username: e.target.value,
                        } as Platform,
                      })
                    }
                    placeholder="@username"
                  />
                  <Input
                    label="מספר עוקבים"
                    type="number"
                    value={platforms.tiktok?.followers || 0}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        tiktok: {
                          ...platforms.tiktok,
                          followers: parseInt(e.target.value) || 0,
                        } as Platform,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* YouTube */}
              <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📺</span>
                  <h3 className="text-white font-medium">YouTube</h3>
                </div>
                <div className="grid gap-3">
                  <Input
                    label="שם ערוץ"
                    type="text"
                    value={platforms.youtube?.username || ''}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        youtube: {
                          ...platforms.youtube,
                          username: e.target.value,
                        } as Platform,
                      })
                    }
                    placeholder="Channel Name"
                  />
                  <Input
                    label="מספר מנויים"
                    type="number"
                    value={platforms.youtube?.followers || 0}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        youtube: {
                          ...platforms.youtube,
                          followers: parseInt(e.target.value) || 0,
                        } as Platform,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Facebook */}
              <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">👍</span>
                  <h3 className="text-white font-medium">Facebook</h3>
                </div>
                <div className="grid gap-3">
                  <Input
                    label="שם משתמש"
                    type="text"
                    value={platforms.facebook?.username || ''}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        facebook: {
                          ...platforms.facebook,
                          username: e.target.value,
                        } as Platform,
                      })
                    }
                    placeholder="username"
                  />
                  <Input
                    label="מספר עוקבים"
                    type="number"
                    value={platforms.facebook?.followers || 0}
                    onChange={(e) =>
                      setPlatforms({
                        ...platforms,
                        facebook: {
                          ...platforms.facebook,
                          followers: parseInt(e.target.value) || 0,
                        } as Platform,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <Button
                onClick={handleSavePlatforms}
                disabled={saving}
                className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
              >
                {saving ? 'שומר...' : 'שמור קישורים חברתיים'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
