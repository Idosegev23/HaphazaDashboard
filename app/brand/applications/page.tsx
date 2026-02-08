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
    users_profiles: {
      display_name: string;
      email: string;
      age: number | null;
      gender: string | null;
      country: string | null;
    } | null;
  } | null;
};

export default function BrandApplicationsPage() {
  const { user } = useUser();
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
    if (!user?.brand_id) return;
    loadApplications();
  }, [user?.brand_id]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const loadApplications = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        message,
        created_at,
        campaigns!inner(title, brand_id),
        creators(user_id, niches, platforms, users_profiles(display_name, email, age, gender, country))
      `)
      .eq('campaigns.brand_id', user?.brand_id!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading applications:', error);
      setLoading(false);
      return;
    }

    setApplications(data as any || []);
    
    // Extract unique niches and countries
    const niches = new Set<string>();
    const countries = new Set<string>();
    
    data?.forEach((app: any) => {
      app.creators?.niches?.forEach((n: string) => niches.add(n));
      if (app.creators?.users_profiles?.country) countries.add(app.creators.users_profiles.country);
    });

    setAvailableNiches(Array.from(niches).sort());
    setAvailableCountries(Array.from(countries).sort());
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Age filter
    if (filters.ageMin) {
      filtered = filtered.filter(app => 
        app.creators?.users_profiles?.age && app.creators.users_profiles.age >= Number(filters.ageMin)
      );
    }
    if (filters.ageMax) {
      filtered = filtered.filter(app => 
        app.creators?.users_profiles?.age && app.creators.users_profiles.age <= Number(filters.ageMax)
      );
    }

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(app => 
        app.creators?.users_profiles?.gender === filters.gender
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
        app.creators?.users_profiles?.country === filters.country
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
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
                            {application.creators?.users_profiles?.age && (
                              <span> • גיל {application.creators.users_profiles.age}</span>
                            )}
                            {application.creators?.users_profiles?.gender && (
                              <span> • {application.creators.users_profiles.gender === 'female' ? 'נקבה' : application.creators.users_profiles.gender === 'male' ? 'זכר' : 'אחר'}</span>
                            )}
                          </div>
                          <div>
                            🏷️ {application.creators?.niches?.join(', ') || 'לא צוין'}
                          </div>
                          {application.creators?.users_profiles?.country && (
                            <div>🌍 {application.creators.users_profiles.country}</div>
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
