'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import {
  CreatorCard,
  CatalogCreator,
  PortfolioPreview,
  StarRating,
  getTotalFollowers,
  formatFollowers,
  PLATFORM_ICONS,
} from '@/components/brand/CreatorCard';
import { DrawerPanel } from '@/components/layout/DrawerPanel';
import { TierBadge, TierLevel } from '@/components/ui/TierBadge';

const NICHES = [
  'אופנה', 'יופי וקוסמטיקה', 'כושר ובריאות', 'אוכל ומתכונים',
  'טכנולוגיה', 'משחקים', 'טיולים ונופש', 'לייפסטייל',
  'הורות וילדים', 'עיצוב הבית', 'DIY ויצירה', 'עסקים ויזמות',
  'חינוך', 'בידור', 'ספורט', 'מוזיקה', 'אמנות', 'ספרים',
];

const TIERS = [
  { value: 'elite', label: 'Elite \uD83D\uDC51' },
  { value: 'pro', label: 'Pro \u2B50' },
  { value: 'verified', label: 'Verified \u2705' },
  { value: 'starter', label: 'Starter \uD83C\uDF31' },
];

const LANG_LABELS: Record<string, string> = {
  he: 'עברית',
  en: 'English',
};

type FullPortfolioItem = {
  id: string;
  media_url: string;
  media_type: string;
  title: string;
};

export default function CreatorCatalogPage() {
  const { user } = useUser();
  const router = useRouter();

  const [creators, setCreators] = useState<CatalogCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Favorites (stored in localStorage per brand user)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [minRating, setMinRating] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'followers' | 'recent'>('recent');

  // Drawer
  const [selectedCreator, setSelectedCreator] = useState<CatalogCreator | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<FullPortfolioItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user', 'admin'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  // Load favorites from localStorage
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`creator_favorites_${user.id}`);
      if (stored) {
        try {
          setFavorites(new Set(JSON.parse(stored)));
        } catch {}
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadCreators();
  }, [user?.id]);

  const loadCreators = async () => {
    const supabase = createClient();

    // Load creators
    const { data, error } = await supabase
      .from('creators')
      .select(`
        user_id, bio, city, niches, tier, platforms, gender, country, age_range,
        verified_at, created_at,
        users_profiles!creators_profile_fkey!inner(display_name, avatar_url, language),
        creator_metrics(average_rating, total_tasks, approval_rate)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading creators:', error);
      setLoading(false);
      return;
    }

    const creatorsData = (data || []) as unknown as CatalogCreator[];

    // Load portfolio previews for all creators (batch)
    if (creatorsData.length > 0) {
      const creatorIds = creatorsData.map((c) => c.user_id);
      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('id, creator_id, media_url, media_type, title')
        .in('creator_id', creatorIds)
        .order('created_at', { ascending: false });

      if (portfolioData) {
        // Group portfolio items by creator_id
        const portfolioMap = new Map<string, PortfolioPreview[]>();
        for (const item of portfolioData) {
          const existing = portfolioMap.get((item as any).creator_id) || [];
          if (existing.length < 6) {
            existing.push({
              id: item.id,
              media_url: item.media_url,
              media_type: item.media_type,
              title: item.title,
            });
          }
          portfolioMap.set((item as any).creator_id, existing);
        }

        // Attach portfolio previews to creators
        for (const creator of creatorsData) {
          creator.portfolio_preview = portfolioMap.get(creator.user_id) || [];
        }
      }
    }

    setCreators(creatorsData);
    setLoading(false);
  };

  const toggleFavorite = useCallback((creatorId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(creatorId)) {
        next.delete(creatorId);
      } else {
        next.add(creatorId);
      }
      // Persist to localStorage
      if (user?.id) {
        localStorage.setItem(`creator_favorites_${user.id}`, JSON.stringify([...next]));
      }
      return next;
    });
  }, [user?.id]);

  const openCreatorDrawer = async (creator: CatalogCreator) => {
    setSelectedCreator(creator);
    setDrawerOpen(true);
    setLoadingPortfolio(true);

    const supabase = createClient();
    const { data } = await supabase
      .from('portfolio_items')
      .select('id, media_url, media_type, title')
      .eq('creator_id', creator.user_id)
      .order('created_at', { ascending: false });

    setPortfolioItems((data || []) as FullPortfolioItem[]);
    setLoadingPortfolio(false);
  };

  // Extract unique countries from data
  const countries = useMemo(() => {
    const set = new Set<string>();
    creators.forEach((c) => c.country && set.add(c.country));
    return Array.from(set).sort();
  }, [creators]);

  // Filter + Sort
  const filteredCreators = useMemo(() => {
    let result = creators.filter((c) => {
      // Favorites only
      if (showFavoritesOnly && !favorites.has(c.user_id)) return false;
      // Search
      if (search) {
        const name = c.users_profiles?.display_name?.toLowerCase() || '';
        if (!name.includes(search.toLowerCase())) return false;
      }
      // Niche
      if (nicheFilter !== 'all') {
        if (!c.niches?.includes(nicheFilter)) return false;
      }
      // Tier
      if (tierFilter !== 'all') {
        if ((c.tier || 'starter') !== tierFilter) return false;
      }
      // Gender
      if (genderFilter !== 'all') {
        if (c.gender !== genderFilter) return false;
      }
      // Country
      if (countryFilter !== 'all') {
        if (c.country !== countryFilter) return false;
      }
      // Min rating
      if (minRating) {
        const rating = c.creator_metrics?.[0]?.average_rating || 0;
        if (rating < parseFloat(minRating)) return false;
      }
      // Age filter
      if (ageFilter !== 'all' && c.age_range) {
        if (c.age_range !== ageFilter) return false;
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.creator_metrics?.[0]?.average_rating || 0) -
          (a.creator_metrics?.[0]?.average_rating || 0);
      }
      if (sortBy === 'followers') {
        return getTotalFollowers(b.platforms) - getTotalFollowers(a.platforms);
      }
      return 0; // 'recent' - already ordered by created_at desc
    });

    return result;
  }, [creators, search, nicheFilter, tierFilter, genderFilter, countryFilter, minRating, ageFilter, sortBy, showFavoritesOnly, favorites]);

  const resetFilters = () => {
    setSearch('');
    setNicheFilter('all');
    setTierFilter('all');
    setGenderFilter('all');
    setCountryFilter('all');
    setMinRating('');
    setAgeFilter('all');
    setSortBy('recent');
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = search || nicheFilter !== 'all' || tierFilter !== 'all' ||
    genderFilter !== 'all' || countryFilter !== 'all' || minRating || ageFilter !== 'all' || showFavoritesOnly;

  // Extract unique age ranges
  const ageRanges = useMemo(() => {
    const set = new Set<string>();
    creators.forEach((c) => c.age_range && set.add(c.age_range));
    return Array.from(set).sort();
  }, [creators]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#f2cc0d] border-t-transparent rounded-full animate-spin" />
          <div className="text-[#6c757d] text-lg">טוען קטלוג יוצרים...</div>
        </div>
      </div>
    );
  }

  const sc = selectedCreator;
  const scMetrics = sc?.creator_metrics?.[0];
  const scJoinDate = sc?.created_at
    ? new Date(sc.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#212529]">מאגר יוצרים</h1>
            <p className="text-[#6c757d] text-sm mt-1">
              {showFavoritesOnly
                ? `${filteredCreators.length} יוצרים מועדפים`
                : `מציג ${filteredCreators.length} מתוך ${creators.length} יוצרים`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#868e96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="חיפוש לפי שם..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 pl-4 py-2.5 bg-white border border-[#dee2e6] rounded-xl text-[#212529] focus:outline-none focus:border-[#f2cc0d] focus:ring-2 focus:ring-[#f2cc0d]/20 w-52 text-sm transition-all"
              />
            </div>
            {/* Favorites toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all text-sm border ${
                showFavoritesOnly
                  ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                  : 'bg-white text-[#495057] border-[#dee2e6] hover:bg-[#f8f9fa]'
              }`}
            >
              {showFavoritesOnly ? '\u2764\uFE0F' : '\u2661'} מועדפים
              {favorites.size > 0 && ` (${favorites.size})`}
            </button>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all text-sm border flex items-center gap-2 ${
                hasActiveFilters && !showFavoritesOnly
                  ? 'bg-[#f2cc0d] text-black border-[#f2cc0d] shadow-sm'
                  : 'bg-white text-[#495057] border-[#dee2e6] hover:bg-[#f8f9fa]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? 'הסתר פילטרים' : 'פילטרים'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="!rounded-2xl">
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Niche */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">קטגוריה</label>
                <select
                  value={nicheFilter}
                  onChange={(e) => setNicheFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
                >
                  <option value="all">הכל</option>
                  {NICHES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Tier */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">דרגה</label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
                >
                  <option value="all">הכל</option>
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">מגדר</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
                >
                  <option value="all">הכל</option>
                  <option value="female">נקבה</option>
                  <option value="male">זכר</option>
                  <option value="other">אחר</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">גיל</label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
                >
                  <option value="all">הכל</option>
                  {ageRanges.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">מדינה</label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
                >
                  <option value="all">הכל</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">דירוג מינימלי</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
                >
                  <option value="">הכל</option>
                  <option value="4.5">4.5+</option>
                  <option value="4">4+</option>
                  <option value="3.5">3.5+</option>
                  <option value="3">3+</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">מיון</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d]"
                >
                  <option value="recent">חדשים</option>
                  <option value="rating">דירוג</option>
                  <option value="followers">עוקבים</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-[#dee2e6]">
                <button
                  onClick={resetFilters}
                  className="text-sm text-[#6c757d] hover:text-[#212529] transition-colors"
                >
                  איפוס פילטרים
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Creator Grid - responsive content-first layout */}
        {filteredCreators.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {filteredCreators.map((creator) => (
              <CreatorCard
                key={creator.user_id}
                creator={creator}
                onClick={() => openCreatorDrawer(creator)}
                isFavorite={favorites.has(creator.user_id)}
                onToggleFavorite={() => toggleFavorite(creator.user_id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-[#dee2e6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[#6c757d] text-lg mb-1">
              {showFavoritesOnly
                ? 'אין יוצרים מועדפים עדיין'
                : hasActiveFilters
                ? 'לא נמצאו יוצרים התואמים את הפילטרים'
                : 'אין יוצרים במערכת עדיין'}
            </p>
            <p className="text-[#adb5bd] text-sm">
              {showFavoritesOnly
                ? 'לחץ על הלב בכרטיס יוצר כדי להוסיף למועדפים'
                : hasActiveFilters
                ? 'נסה לשנות את הסינון'
                : ''}
            </p>
          </div>
        )}
      </div>

      {/* Creator Detail Drawer */}
      <DrawerPanel
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCreator(null);
          setPortfolioItems([]);
        }}
        title={sc?.users_profiles?.display_name || 'פרופיל יוצר'}
      >
        {sc && (
          <div className="space-y-6">
            {/* Hero portfolio in drawer */}
            {portfolioItems.length > 0 && !loadingPortfolio && (
              <div className="relative -mx-6 -mt-6 mb-4">
                <div className="aspect-video overflow-hidden bg-[#f8f9fa]">
                  {portfolioItems[0].media_type === 'video' ? (
                    <video
                      src={portfolioItems[0].media_url}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={portfolioItems[0].media_url}
                      alt={portfolioItems[0].title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-3 ${
                  sc.verified_at ? 'border-[#f2cc0d]' : 'border-[#dee2e6]'
                }`}
              >
                {sc.users_profiles?.avatar_url ? (
                  <img
                    src={sc.users_profiles.avatar_url}
                    alt={sc.users_profiles.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center text-3xl text-[#6c757d]">
                    {(sc.users_profiles?.display_name || '?').charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-[#212529]">
                    {sc.users_profiles?.display_name}
                  </h3>
                  <button
                    onClick={() => toggleFavorite(sc.user_id)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {favorites.has(sc.user_id) ? '\u2764\uFE0F' : '\u2661'}
                  </button>
                </div>
                <StarRating rating={scMetrics?.average_rating ?? null} />
                {sc.tier && (
                  <div className="mt-1">
                    <TierBadge tier={sc.tier as TierLevel} showTooltip={false} />
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {sc.bio && (
              <div>
                <h4 className="text-sm font-medium text-[#6c757d] mb-2">אודות</h4>
                <p className="text-[#212529] leading-relaxed whitespace-pre-wrap">{sc.bio}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {sc.age_range && (
                <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#dee2e6]">
                  <div className="text-xs text-[#6c757d] mb-1">גיל</div>
                  <div className="text-[#212529] font-medium">{sc.age_range}</div>
                </div>
              )}
              {(sc.city || sc.country) && (
                <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#dee2e6]">
                  <div className="text-xs text-[#6c757d] mb-1">מיקום</div>
                  <div className="text-[#212529] font-medium">
                    {[sc.city, sc.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
              {scJoinDate && (
                <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#dee2e6]">
                  <div className="text-xs text-[#6c757d] mb-1">תאריך הצטרפות</div>
                  <div className="text-[#212529] font-medium">{scJoinDate}</div>
                </div>
              )}
              {sc.users_profiles?.language && (
                <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#dee2e6]">
                  <div className="text-xs text-[#6c757d] mb-1">שפה</div>
                  <div className="text-[#212529] font-medium">
                    {LANG_LABELS[sc.users_profiles.language] || sc.users_profiles.language}
                  </div>
                </div>
              )}
              {sc.gender && (
                <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#dee2e6]">
                  <div className="text-xs text-[#6c757d] mb-1">מגדר</div>
                  <div className="text-[#212529] font-medium">
                    {sc.gender === 'female' ? 'נקבה' : sc.gender === 'male' ? 'זכר' : 'אחר'}
                  </div>
                </div>
              )}
            </div>

            {/* Niches */}
            {sc.niches && sc.niches.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[#6c757d] mb-2">תחומי עניין</h4>
                <div className="flex flex-wrap gap-2">
                  {sc.niches.map((niche) => (
                    <span
                      key={niche}
                      className="px-3 py-1 bg-[#f2cc0d]/10 rounded-full text-sm text-[#946f00] border border-[#f2cc0d]/20"
                    >
                      {niche}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {scMetrics && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#f8f9fa] rounded-lg p-3 text-center border border-[#dee2e6]">
                  <div className="text-2xl font-bold text-[#212529]">
                    {scMetrics.average_rating?.toFixed(1) || '-'}
                  </div>
                  <div className="text-xs text-[#6c757d]">ציון</div>
                </div>
                <div className="bg-[#f8f9fa] rounded-lg p-3 text-center border border-[#dee2e6]">
                  <div className="text-2xl font-bold text-[#212529]">
                    {scMetrics.total_tasks || 0}
                  </div>
                  <div className="text-xs text-[#6c757d]">קמפיינים</div>
                </div>
                <div className="bg-[#f8f9fa] rounded-lg p-3 text-center border border-[#dee2e6]">
                  <div className="text-2xl font-bold text-[#212529]">
                    {scMetrics.approval_rate ? `${Math.round(scMetrics.approval_rate)}%` : '-'}
                  </div>
                  <div className="text-xs text-[#6c757d]">אחוז אישור</div>
                </div>
              </div>
            )}

            {/* Platforms */}
            {sc.platforms && Object.keys(sc.platforms).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[#6c757d] mb-2">פלטפורמות</h4>
                <div className="space-y-2">
                  {Object.entries(sc.platforms).map(([name, data]) => {
                    if (!data) return null;
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between bg-[#f8f9fa] rounded-lg px-4 py-3 border border-[#dee2e6]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#212529] text-sm w-6">
                            {PLATFORM_ICONS[name] || name}
                          </span>
                          <span className="text-[#212529]">{name}</span>
                          {(data.handle || data.username) && (
                            <span className="text-[#6c757d] text-sm">@{data.handle || data.username}</span>
                          )}
                        </div>
                        {data.followers != null && (
                          <span className="font-bold text-[#212529]">
                            {formatFollowers(data.followers)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex justify-end pt-1">
                    <span className="text-sm font-bold text-[#f2cc0d]">
                      {formatFollowers(getTotalFollowers(sc.platforms))} עוקבים
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Gallery */}
            <div>
              <h4 className="text-sm font-medium text-[#6c757d] mb-2">תיק עבודות</h4>
              {loadingPortfolio ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-[#f2cc0d] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : portfolioItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {portfolioItems.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square rounded-xl overflow-hidden bg-[#f8f9fa] border border-[#dee2e6] hover:border-[#f2cc0d]/40 transition-colors"
                    >
                      {item.media_type === 'video' ? (
                        <video
                          src={item.media_url}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-[#f8f9fa] rounded-xl border border-dashed border-[#dee2e6]">
                  <svg className="w-10 h-10 text-[#dee2e6] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[#adb5bd] text-sm">אין פריטים בתיק העבודות</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}
