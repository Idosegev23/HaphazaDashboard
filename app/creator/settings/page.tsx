'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TutorialPopup } from '@/components/ui/TutorialPopup';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push/client';

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

  const [dateOfBirth, setDateOfBirth] = useState('');

  const [address, setAddress] = useState({
    address_street: '',
    address_city: '',
    address_zip: '',
    phone: '',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    in_app: true,
    push: false,
    email: false,
    whatsapp: false,
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

    // Load user profile + notification preferences
    const { data: profileRaw } = await supabase
      .from('users_profiles')
      .select('display_name, avatar_url, notification_preferences')
      .eq('user_id', user!.id)
      .single();

    if (profileRaw) {
      setProfile({
        display_name: profileRaw.display_name || '',
        avatar_url: profileRaw.avatar_url || '',
      });
      const prefs = profileRaw.notification_preferences as { channels?: string[] } | null;
      if (prefs && prefs.channels) {
        setNotifPrefs({
          in_app: true, // always on
          push: prefs.channels.includes('push'),
          email: prefs.channels.includes('email'),
          whatsapp: false, // always disabled for now
        });
      }
    }

    // Load creator platforms, address, and date_of_birth
    const { data: creatorData } = await supabase
      .from('creators')
      .select('platforms, address_street, address_city, address_zip, phone, date_of_birth')
      .eq('user_id', user!.id)
      .single();

    if (creatorData) {
      const cd = creatorData as any;
      if (cd.platforms) {
        const platformsData = cd.platforms as Record<string, any>;
        setPlatforms({
          instagram: platformsData.instagram || { username: '', followers: 0 },
          tiktok: platformsData.tiktok || { username: '', followers: 0 },
          youtube: platformsData.youtube || { username: '', followers: 0 },
          facebook: platformsData.facebook || { username: '', followers: 0 },
        });
      }
      setAddress({
        address_street: cd.address_street || '',
        address_city: cd.address_city || '',
        address_zip: cd.address_zip || '',
        phone: cd.phone || '',
      });
      setDateOfBirth(cd.date_of_birth || '');
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
      alert(' התמונה עודכנה בהצלחה');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(` שגיאה בהעלאת התמונה: ${error.message}`);
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

      alert(' הפרופיל עודכן בהצלחה');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(` שגיאה בשמירת הפרופיל: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDateOfBirth = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('creators')
        .update({
          date_of_birth: dateOfBirth || null,
        } as any)
        .eq('user_id', user!.id);

      if (error) throw error;
      alert('תאריך הלידה עודכן בהצלחה');
    } catch (error: any) {
      console.error('Error saving date of birth:', error);
      alert('שגיאה בשמירת תאריך הלידה: ' + error.message);
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

      alert(' פלטפורמות עודכנו בהצלחה');
    } catch (error: any) {
      console.error('Error saving platforms:', error);
      alert(` שגיאה בשמירת הפלטפורמות: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifPrefs = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      const channels = ['in_app'];
      if (notifPrefs.push) channels.push('push');
      if (notifPrefs.email) channels.push('email');

      const { error } = await supabase
        .from('users_profiles')
        .update({
          notification_preferences: { channels } as any,
        })
        .eq('user_id', user!.id);

      if (error) throw error;
      alert('העדפות ההתראות עודכנו בהצלחה');
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      alert('שגיאה בשמירה: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('creators')
        .update({
          address_street: address.address_street || null,
          address_city: address.address_city || null,
          address_zip: address.address_zip || null,
          phone: address.phone || null,
        } as any)
        .eq('user_id', user!.id);

      if (error) throw error;
      alert('הכתובת עודכנה בהצלחה');
    } catch (error: any) {
      console.error('Error saving address:', error);
      alert('שגיאה בשמירת הכתובת: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mb-2">הגדרות</h1>
        <p className="text-[#6c757d]">ערוך את הפרופיל והקישורים החברתיים שלך</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Section */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">account_circle</span>
              פרופיל
            </h2>

            <div className="space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-[#212529] mb-2">
                  תמונת פרופיל
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#f8f9fa] border-2 border-[#f2cc0d] flex-shrink-0">
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
                    <p className="text-xs text-[#6c757d] mt-1">
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

          {/* Date of Birth Section */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">cake</span>
              תאריך לידה
            </h2>
            <p className="text-[#6c757d] text-sm mb-4">
              תאריך הלידה שלך משמש להצגת הגיל שלך בקטלוג היוצרים
            </p>

            <div className="space-y-4">
              <Input
                label="תאריך לידה"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />

              <Button
                onClick={handleSaveDateOfBirth}
                disabled={saving}
                className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
              >
                {saving ? 'שומר...' : 'שמור תאריך לידה'}
              </Button>
            </div>
          </Card>

          {/* Social Platforms Section */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">share</span>
              קישורים חברתיים
            </h2>

            <div className="space-y-4">
              {/* Instagram */}
              <div className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                <div className="flex items-center gap-2 mb-3">
                  
                  <h3 className="text-[#212529] font-medium">Instagram</h3>
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
              <div className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                <div className="flex items-center gap-2 mb-3">
                  
                  <h3 className="text-[#212529] font-medium">TikTok</h3>
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
              <div className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                <div className="flex items-center gap-2 mb-3">
                  
                  <h3 className="text-[#212529] font-medium">YouTube</h3>
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
              <div className="bg-[#f8f9fa] rounded-lg p-4 border border-[#dee2e6]">
                <div className="flex items-center gap-2 mb-3">
                  
                  <h3 className="text-[#212529] font-medium">Facebook</h3>
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

          {/* Notification Preferences Section */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">notifications</span>
              העדפות התראות
            </h2>
            <p className="text-[#6c757d] text-sm mb-4">
              בחר את ערוצי ההתראות המועדפים עליך
            </p>

            <div className="space-y-3">
              {/* In-App - always on */}
              <div className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]">
                <div>
                  <span className="text-[#212529] font-medium">התראות במערכת</span>
                  <p className="text-[#6c757d] text-xs">תמיד פעיל</p>
                </div>
                <div className="relative w-12 h-6 rounded-full bg-[#f2cc0d] cursor-not-allowed opacity-70">
                  <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>

              {/* Push */}
              <div className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]">
                <div>
                  <span className="text-[#212529] font-medium">התראות Push</span>
                  <p className="text-[#6c757d] text-xs">קבל התראות ישירות לדפדפן</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!notifPrefs.push) {
                      const ok = await subscribeToPush();
                      if (ok) setNotifPrefs({ ...notifPrefs, push: true });
                      else alert('לא ניתן להפעיל התראות Push. ודא שאישרת התראות בדפדפן.');
                    } else {
                      await unsubscribeFromPush();
                      setNotifPrefs({ ...notifPrefs, push: false });
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifPrefs.push ? 'bg-[#f2cc0d]' : 'bg-[#dee2e6]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifPrefs.push ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]">
                <div>
                  <span className="text-[#212529] font-medium">התראות אימייל</span>
                  <p className="text-[#6c757d] text-xs">קבל עדכונים חשובים למייל</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifPrefs({ ...notifPrefs, email: !notifPrefs.email })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifPrefs.email ? 'bg-[#f2cc0d]' : 'bg-[#dee2e6]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifPrefs.email ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* WhatsApp - coming soon */}
              <div className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-lg border border-[#dee2e6] opacity-60">
                <div>
                  <span className="text-[#212529] font-medium">WhatsApp</span>
                  <p className="text-[#6c757d] text-xs">בקרוב</p>
                </div>
                <div className="relative w-12 h-6 rounded-full bg-[#dee2e6] cursor-not-allowed">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>

              <Button
                onClick={handleSaveNotifPrefs}
                disabled={saving}
                className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
              >
                {saving ? 'שומר...' : 'שמור העדפות'}
              </Button>
            </div>
          </Card>

          {/* Address Section */}
          <Card>
            <h2 className="text-xl font-bold text-[#212529] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">home</span>
              כתובת למשלוחים
            </h2>
            <p className="text-[#6c757d] text-sm mb-4">
              הכתובת תשמש לקבלת מוצרים מקמפיינים שדורשים משלוח
            </p>

            <div className="space-y-4">
              <Input
                label="רחוב ומספר"
                type="text"
                value={address.address_street}
                onChange={(e) => setAddress({ ...address, address_street: e.target.value })}
                placeholder="רחוב הרצל 15, דירה 3"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="עיר"
                  type="text"
                  value={address.address_city}
                  onChange={(e) => setAddress({ ...address, address_city: e.target.value })}
                  placeholder="תל אביב"
                />
                <Input
                  label="מיקוד"
                  type="text"
                  value={address.address_zip}
                  onChange={(e) => setAddress({ ...address, address_zip: e.target.value })}
                  placeholder="6120101"
                />
              </div>

              <Input
                label="טלפון"
                type="tel"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                placeholder="050-1234567"
              />

              <Button
                onClick={handleSaveAddress}
                disabled={saving}
                className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
              >
                {saving ? 'שומר...' : 'שמור כתובת'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <TutorialPopup tutorialKey="creator_settings" />
    </div>
  );
}
