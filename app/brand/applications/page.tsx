'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type Application = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  campaigns: {
    title: string;
  } | null;
  creators: {
    user_id: string;
    niches: string[] | null;
    platforms: any;
    age_range: string | null;
    gender: string | null;
    country: string | null;
    users_profiles: {
      display_name: string;
      email: string;
    } | null;
  } | null;
};

export default function BrandApplicationsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    gender: 'all',
    niche: 'all',
    country: 'all',
    status: 'all',
  });

  // Available options (will be populated from data)
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.brand_id) {
      console.log('User loaded but no brand_id:', user);
      return;
    }
    loadApplications();
  }, [user?.brand_id, userLoading]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const loadApplications = async () => {
    if (!user?.brand_id) {
      console.error('No brand_id found for user:', user);
      setLoading(false);
      return;
    }

    console.log('Loading applications for brand_id:', user.brand_id);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        message,
        created_at,
        campaigns!inner(title, brand_id),
        creators(user_id, niches, platforms, age_range, gender, country, users_profiles(display_name, email))
      `)
      .eq('campaigns.brand_id', user.brand_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading applications:', error);
      setLoading(false);
      return;
    }

    console.log('Loaded applications:', data?.length || 0, 'items');

    setApplications(data as any || []);
    
    // Extract unique niches and countries
    const niches = new Set<string>();
    const countries = new Set<string>();
    
    data?.forEach((app: any) => {
      app.creators?.niches?.forEach((n: string) => niches.add(n));
      if (app.creators?.country) countries.add(app.creators.country);
    });

    setAvailableNiches(Array.from(niches).sort());
    setAvailableCountries(Array.from(countries).sort());
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Age filter (age_range is string like "18-24", not numeric)
    // TODO: implement proper age_range filtering
    if (filters.ageMin || filters.ageMax) {
      // לעת עתה - לא מפלטרים לפי גיל כי זה range ולא number
    }

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(app => 
        app.creators?.gender === filters.gender
      );
    }

    // Niche filter
    if (filters.niche !== 'all') {
      filtered = filtered.filter(app => 
        app.creators?.niches?.includes(filters.niche)
      );
    }

    // Country filter
    if (filters.country !== 'all') {
      filtered = filtered.filter(app => 
        app.creators?.country === filters.country
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    setFilteredApplications(filtered);
  };

  const resetFilters = () => {
    setFilters({
      ageMin: '',
      ageMax: '',
      gender: 'all',
      niche: 'all',
      country: 'all',
      status: 'all',
    });
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (!user?.brand_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <div className="text-xl mb-4">שגיאה: לא נמצא מותג למשתמש</div>
          <div className="text-sm text-[#cbc190] mb-4">
            User ID: {user?.id || 'N/A'}<br/>
            Role: {user?.role || 'N/A'}<br/>
            Brand ID: {user?.brand_id || 'MISSING'}
          </div>
          <button 
            onClick={() => router.push('/brand/dashboard')}
            className="mt-4 px-6 py-2 bg-[#f2cc0d] text-black rounded-lg hover:bg-[#d4b00b]"
          >
            חזרה לדשבורד
          </button>
        </div>
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

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'ageMin' || key === 'ageMax') return value !== '';
    return value !== 'all';
  }).length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">👥 בחירת משפיענים</h1>
              <p className="text-[#cbc190]">סקירת מועמדויות ובחירת משפיענים לקמפיינים</p>
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-[#f2cc0d] text-black hover:bg-[#d4b50c]"
            >
              🔍 סינון {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mb-6 bg-[#2e2a1b] border border-[#494222]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-white font-bold">סינון יוצרות</h3>
                <Button
                  onClick={resetFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-sm"
                >
                  איפוס
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">גיל</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="מינ'"
                      value={filters.ageMin}
                      onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                    />
                    <input
                      type="number"
                      placeholder="מקס'"
                      value={filters.ageMax}
                      onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">מגדר</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                  >
                    <option value="all">הכל</option>
                    <option value="female">נקבה</option>
                    <option value="male">זכר</option>
                    <option value="other">אחר</option>
                  </select>
                </div>

                {/* Niche */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">נישה</label>
                  <select
                    value={filters.niche}
                    onChange={(e) => setFilters({ ...filters, niche: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                  >
                    <option value="all">הכל</option>
                    {availableNiches.map((niche) => (
                      <option key={niche} value={niche}>{niche}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">מדינה</label>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                  >
                    <option value="all">הכל</option>
                    {availableCountries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">סטטוס</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
                  >
                    <option value="all">הכל</option>
                    <option value="submitted">ממתין</option>
                    <option value="approved">אושר</option>
                    <option value="rejected">נדחה</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 text-sm text-[#cbc190]">
                מציג {filteredApplications.length} מתוך {applications.length} בקשות
              </div>
            </Card>
          )}
        </div>

        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Link key={application.id} href={`/brand/applications/${application.id}`}>
                <Card hover className="relative">
                  <div className={`status-stripe ${statusColors[application.status || 'submitted']}`} />
                  <div className="pl-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">
                          {application.campaigns?.title || 'ללא שם'}
                        </h3>
                        <div className="text-sm text-[#cbc190] mb-2 space-y-1">
                          <div>
                            👤 {application.creators?.users_profiles?.display_name || 'לא זמין'}
                            {application.creators?.age_range && (
                              <span> • גיל {application.creators.age_range}</span>
                            )}
                            {application.creators?.gender && (
                              <span> • {application.creators.gender === 'female' ? 'נקבה' : application.creators.gender === 'male' ? 'זכר' : 'אחר'}</span>
                            )}
                          </div>
                          <div>
                            🏷️ {application.creators?.niches?.join(', ') || 'לא צוין'}
                          </div>
                          {application.creators?.country && (
                            <div>🌍 {application.creators.country}</div>
                          )}
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
            <p className="text-[#cbc190] text-center py-8">
              {applications.length === 0 ? 'אין בקשות עדיין' : 'לא נמצאו בקשות התואמות את הפילטרים'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
