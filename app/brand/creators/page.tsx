'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  PlatformIcon,
  getPlatformColor,
} from '@/components/brand/CreatorCard';
import { TierBadge, TierLevel } from '@/components/ui/TierBadge';

const PAGE_SIZE = 24;

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

const PLATFORM_URLS: Record<string, (handle: string) => string> = {
  Instagram: (h) => `https://instagram.com/${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
  TikTok: (h) => `https://tiktok.com/@${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  YouTube: (h) => `https://youtube.com/@${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  Facebook: (h) => `https://facebook.com/${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  'Twitter/X': (h) => `https://x.com/${h}`,
  LinkedIn: (h) => `https://linkedin.com/in/${h}`,
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  Threads: (h) => `https://threads.net/@${h}`,
  threads: (h) => `https://threads.net/@${h}`,
};

type FullPortfolioItem = {
  id: string;
  media_url: string;
  media_type: string;
  title: string;
  description: string | null;
  platform: string | null;
  external_link: string | null;
};

type CreatorDetailData = {
  ratingBreakdown: {
    quality: number;
    communication: number;
    on_time: number;
    revision: number;
    totalRatings: number;
  } | null;
  reviews: Array<{
    note: string;
    created_at: string;
    quality: number | null;
  }>;
  taskSummary: {
    total: number;
    approved: number;
    inProgress: number;
    disputed: number;
  };
};

type FilterOptions = {
  countries: string[];
  ageRanges: string[];
};

export default function CreatorCatalogPage() {
  const { user } = useUser();
  const router = useRouter();

  // Creator data (paginated)
  const [creators, setCreators] = useState<CatalogCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const loadVersionRef = useRef(0);

  const [showFilters, setShowFilters] = useState(false);

  // Favorites (stored in localStorage per brand user)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'followers' | 'recent'>('recent');

  // Filter options from server
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ countries: [], ageRanges: [] });

  // Modal
  const [selectedCreator, setSelectedCreator] = useState<CatalogCreator | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<FullPortfolioItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [creatorDetail, setCreatorDetail] = useState<CreatorDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  // Load filter options (countries, age ranges) once
  useEffect(() => {
    const loadFilterOptions = async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc('get_catalog_filter_options' as any);
      if (data) setFilterOptions(data as unknown as FilterOptions);
    };
    loadFilterOptions();
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Favorites key: only trigger reload when favorites change AND showFavoritesOnly is on
  const favFilterKey = showFavoritesOnly ? [...favorites].sort().join(',') : 'off';

  // Load page when filters change (reset to page 1)
  useEffect(() => {
    if (!user?.id) return;

    loadVersionRef.current += 1;
    const version = loadVersionRef.current;

    const load = async () => {
      setLoading(true);
      offsetRef.current = 0;

      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_creator_catalog_page' as any, {
        p_limit: PAGE_SIZE,
        p_offset: 0,
        p_search: debouncedSearch || null,
        p_niche: nicheFilter !== 'all' ? nicheFilter : null,
        p_tier: tierFilter !== 'all' ? tierFilter : null,
        p_gender: genderFilter !== 'all' ? genderFilter : null,
        p_age_range: ageFilter !== 'all' ? ageFilter : null,
        p_sort: sortBy,
        p_favorite_ids: showFavoritesOnly ? Array.from(favorites) : null,
      });

      // Discard stale responses
      if (version !== loadVersionRef.current) return;

      if (error) {
        console.error('Error loading creators:', error);
        setLoading(false);
        return;
      }

      const result = data as any;
      const newCreators = (result.creators || []) as CatalogCreator[];
      setCreators(newCreators);
      setTotalCount(result.total || 0);
      setHasMore(result.hasMore || false);
      offsetRef.current = newCreators.length;
      setLoading(false);
    };

    load();
  }, [user?.id, debouncedSearch, nicheFilter, tierFilter, genderFilter, ageFilter, sortBy, favFilterKey]);

  // Load more (next page) for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const currentVersion = loadVersionRef.current;
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_creator_catalog_page' as any, {
      p_limit: PAGE_SIZE,
      p_offset: offsetRef.current,
      p_search: debouncedSearch || null,
      p_niche: nicheFilter !== 'all' ? nicheFilter : null,
      p_tier: tierFilter !== 'all' ? tierFilter : null,
      p_gender: genderFilter !== 'all' ? genderFilter : null,
      p_age_range: ageFilter !== 'all' ? ageFilter : null,
      p_sort: sortBy,
      p_favorite_ids: showFavoritesOnly ? Array.from(favorites) : null,
    });

    // Discard if filters changed while loading
    if (currentVersion !== loadVersionRef.current) {
      setLoadingMore(false);
      return;
    }

    if (error) {
      console.error('Error loading more creators:', error);
      setLoadingMore(false);
      return;
    }

    const result = data as any;
    const newCreators = (result.creators || []) as CatalogCreator[];
    setCreators(prev => [...prev, ...newCreators]);
    setHasMore(result.hasMore || false);
    offsetRef.current += newCreators.length;
    setLoadingMore(false);
  }, [loadingMore, hasMore, debouncedSearch, nicheFilter, tierFilter, genderFilter, ageFilter, sortBy, showFavoritesOnly, favorites]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

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

  const openCreatorModal = async (creator: CatalogCreator) => {
    setSelectedCreator(creator);
    setModalOpen(true);
    setActiveMediaIndex(0);
    setLoadingPortfolio(true);
    setLoadingDetail(true);
    setCreatorDetail(null);
    document.body.style.overflow = 'hidden';

    const supabase = createClient();

    // Fetch portfolio items and creator detail in parallel
    const [portfolioRes, detailRes] = await Promise.all([
      supabase
        .from('portfolio_items')
        .select('id, media_url, media_type, title, description, platform, external_link')
        .eq('creator_id', creator.user_id)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_creator_profile_details' as any, { p_creator_id: creator.user_id }),
    ]);

    setPortfolioItems((portfolioRes.data || []) as FullPortfolioItem[]);
    setLoadingPortfolio(false);

    if (detailRes.data) {
      setCreatorDetail(detailRes.data as unknown as CreatorDetailData);
    }
    setLoadingDetail(false);
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedCreator(null);
    setPortfolioItems([]);
    setActiveMediaIndex(0);
    setCreatorDetail(null);
    document.body.style.overflow = '';
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) closeModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalOpen, closeModal]);

  const resetFilters = () => {
    setSearchInput('');
    setNicheFilter('all');
    setTierFilter('all');
    setGenderFilter('all');
    setAgeFilter('all');
    setSortBy('recent');
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = searchInput || nicheFilter !== 'all' || tierFilter !== 'all' ||
    genderFilter !== 'all' || ageFilter !== 'all' || showFavoritesOnly;

  if (loading && creators.length === 0) {
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
              {creators.length < totalCount
                ? `מציג ${creators.length} מתוך ${totalCount} יוצרים`
                : `${totalCount} יוצרים`}
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
                placeholder="חיפוש לפי שם, עיר, ביו..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10 pl-4 py-2.5 bg-white border border-[#dee2e6] rounded-xl text-[#212529] focus:outline-none focus:border-[#f2cc0d] focus:ring-2 focus:ring-[#f2cc0d]/20 w-64 text-sm transition-all"
              />
            </div>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-white border border-[#dee2e6] rounded-xl text-[#212529] text-sm focus:outline-none focus:border-[#f2cc0d] cursor-pointer"
            >
              <option value="recent">חדשים</option>
              <option value="rating">דירוג</option>
              <option value="followers">עוקבים</option>
            </select>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">מין</label>
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
                  {filterOptions.ageRanges.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Niche / Category */}
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

              {/* Creator Type / Tier */}
              <div>
                <label className="block text-xs font-medium text-[#6c757d] mb-1">סוג יוצר</label>
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
        {creators.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.user_id}
                  creator={creator}
                  onClick={() => openCreatorModal(creator)}
                  isFavorite={favorites.has(creator.user_id)}
                  onToggleFavorite={() => toggleFavorite(creator.user_id)}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#f2cc0d] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[#6c757d] text-sm">טוען עוד יוצרים...</span>
                </div>
              </div>
            )}

            {/* End of list */}
            {!hasMore && !loading && creators.length > 0 && creators.length >= PAGE_SIZE && (
              <div className="text-center py-6">
                <p className="text-[#adb5bd] text-sm">הוצגו כל {totalCount} היוצרים</p>
              </div>
            )}
          </>
        ) : !loading ? (
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
        ) : null}
      </div>

      {/* Creator Profile Modal */}
      {modalOpen && sc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div
            ref={modalRef}
            className="relative z-10 w-[95vw] max-w-[1400px] h-[calc(100vh-1.5rem)] max-h-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-[#495057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

              {/* LEFT: Content Gallery */}
              <div className="lg:w-[60%] flex-shrink-0 p-5 pb-0 lg:pb-5 overflow-y-auto flex flex-col">
                {/* Active media - hero */}
                <div className="relative rounded-xl overflow-hidden bg-[#f1f3f5] flex-1 min-h-0 max-h-[55vh]">
                  {loadingPortfolio ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-[#f2cc0d] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : portfolioItems.length > 0 ? (
                    <>
                      {portfolioItems[activeMediaIndex]?.media_type === 'video' ? (
                        <video
                          key={portfolioItems[activeMediaIndex].id}
                          src={portfolioItems[activeMediaIndex].media_url}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                          autoPlay
                          muted
                        />
                      ) : (
                        <img
                          key={portfolioItems[activeMediaIndex]?.id}
                          src={portfolioItems[activeMediaIndex]?.media_url}
                          alt={portfolioItems[activeMediaIndex]?.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Navigation arrows */}
                      {portfolioItems.length > 1 && (
                        <>
                          <button
                            onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : portfolioItems.length - 1))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                          >
                            <svg className="w-5 h-5 text-[#495057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setActiveMediaIndex((prev) => (prev < portfolioItems.length - 1 ? prev + 1 : 0))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                          >
                            <svg className="w-5 h-5 text-[#495057]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          {/* Counter */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                            {activeMediaIndex + 1} / {portfolioItems.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : sc.users_profiles?.avatar_url ? (
                    <img
                      src={sc.users_profiles.avatar_url}
                      alt={sc.users_profiles.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <span className="text-8xl font-bold text-[#dee2e6]">
                        {(sc.users_profiles?.display_name || '?').charAt(0)}
                      </span>
                      <p className="text-[#adb5bd] text-sm">אין תוכן בתיק עבודות</p>
                    </div>
                  )}
                </div>

                {/* Active item metadata */}
                {!loadingPortfolio && portfolioItems.length > 0 && (() => {
                  const activeItem = portfolioItems[activeMediaIndex];
                  const hasMetadata = activeItem?.title || activeItem?.description || activeItem?.platform || activeItem?.external_link;
                  if (!hasMetadata) return null;
                  return (
                    <div className="mt-2 px-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeItem.title && (
                          <span className="text-sm font-semibold text-[#212529]">{activeItem.title}</span>
                        )}
                        {activeItem.platform && (
                          <span className="px-2 py-0.5 bg-[#f1f3f5] rounded-md text-[10px] font-medium text-[#495057] border border-[#e9ecef]">
                            {activeItem.platform}
                          </span>
                        )}
                        {activeItem.external_link && (
                          <a
                            href={activeItem.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-[#f2cc0d] hover:underline font-medium flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            צפה בפוסט
                          </a>
                        )}
                      </div>
                      {activeItem.description && (
                        <p className="text-xs text-[#6c757d] line-clamp-2">{activeItem.description}</p>
                      )}
                    </div>
                  );
                })()}

                {/* Thumbnails row */}
                {!loadingPortfolio && portfolioItems.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {portfolioItems.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveMediaIndex(idx)}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                          idx === activeMediaIndex
                            ? 'ring-2 ring-[#f2cc0d] ring-offset-2'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {item.media_type === 'video' ? (
                          <>
                            <video
                              src={item.media_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-5 h-5 bg-black/40 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <img
                            src={item.media_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Creator Info */}
              <div className="lg:w-[40%] p-5 lg:pl-6 lg:border-l border-[#f1f3f5] space-y-5 overflow-y-auto">

                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 ${
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
                      <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center text-2xl text-[#6c757d]">
                        {(sc.users_profiles?.display_name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-[#212529] truncate">
                        {sc.users_profiles?.display_name}
                      </h3>
                      <button
                        onClick={() => toggleFavorite(sc.user_id)}
                        className="text-xl hover:scale-110 transition-transform flex-shrink-0"
                      >
                        {favorites.has(sc.user_id) ? '\u2764\uFE0F' : '\u2661'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={scMetrics?.average_rating ?? null} />
                      {sc.tier && (
                        <TierBadge tier={sc.tier as TierLevel} showTooltip={false} showLabel={false} className="scale-90" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {sc.bio && (
                  <p className="text-[#495057] text-sm leading-relaxed whitespace-pre-wrap">{sc.bio}</p>
                )}

                {/* Occupations */}
                {sc.occupations && sc.occupations.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-[#495057]">
                    <svg className="w-4 h-4 text-[#adb5bd] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{sc.occupations.join(' \u00B7 ')}</span>
                  </div>
                )}

                {/* Metrics grid - 2 rows */}
                {scMetrics && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-[#212529]">
                          {scMetrics.average_rating?.toFixed(1) || '-'}
                        </div>
                        <div className="text-[10px] text-[#868e96] font-medium">ציון</div>
                      </div>
                      <div className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-[#212529]">
                          {scMetrics.total_tasks || 0}
                        </div>
                        <div className="text-[10px] text-[#868e96] font-medium">קמפיינים</div>
                      </div>
                      <div className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-[#212529]">
                          {scMetrics.approval_rate ? `${Math.round(scMetrics.approval_rate)}%` : '-'}
                        </div>
                        <div className="text-[10px] text-[#868e96] font-medium">אחוז אישור</div>
                      </div>
                    </div>
                    {/* Reliability row */}
                    {(scMetrics.on_time_rate != null || scMetrics.on_time_deliveries != null) && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                          <div className="text-xl font-bold text-emerald-600">
                            {scMetrics.on_time_rate ? `${Math.round(scMetrics.on_time_rate)}%` : '-'}
                          </div>
                          <div className="text-[10px] text-[#868e96] font-medium">בזמן</div>
                        </div>
                        <div className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                          <div className="text-xl font-bold text-[#212529]">
                            {scMetrics.on_time_deliveries ?? 0}
                          </div>
                          <div className="text-[10px] text-[#868e96] font-medium">משלוחים בזמן</div>
                        </div>
                        <div className="bg-[#f8f9fa] rounded-xl p-3 text-center">
                          <div className="text-xl font-bold text-red-500">
                            {scMetrics.late_deliveries ?? 0}
                          </div>
                          <div className="text-[10px] text-[#868e96] font-medium">מאוחרים</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rating Breakdown */}
                {loadingDetail ? (
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-[#f1f3f5] rounded animate-pulse" />
                    <div className="bg-[#f1f3f5] rounded-xl h-28 animate-pulse" />
                  </div>
                ) : creatorDetail?.ratingBreakdown && creatorDetail.ratingBreakdown.totalRatings > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-medium text-[#868e96] uppercase tracking-wide">פירוט דירוגים</h4>
                    {[
                      { label: 'איכות', value: creatorDetail.ratingBreakdown.quality },
                      { label: 'תקשורת', value: creatorDetail.ratingBreakdown.communication },
                      { label: 'עמידה בזמנים', value: creatorDetail.ratingBreakdown.on_time },
                      { label: 'תיקונים', value: creatorDetail.ratingBreakdown.revision },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-[#868e96] w-24 text-right flex-shrink-0">{item.label}</span>
                        <div className="flex-1 h-2 bg-[#f1f3f5] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#f2cc0d] rounded-full transition-all"
                            style={{ width: `${(item.value / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#212529] w-8 text-left">{item.value.toFixed(1)}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-[#adb5bd]">
                      מבוסס על {creatorDetail.ratingBreakdown.totalRatings} דירוגים
                    </p>
                  </div>
                )}

                {/* Brand Reviews */}
                {!loadingDetail && creatorDetail?.reviews && creatorDetail.reviews.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-[#868e96] uppercase tracking-wide">ביקורות מלקוחות</h4>
                    <div className="space-y-2">
                      {creatorDetail.reviews.map((review, idx) => (
                        <div key={idx} className="bg-[#f8f9fa] rounded-xl p-3 space-y-1">
                          <div className="flex items-center gap-2">
                            {review.quality != null && (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <span
                                    key={i}
                                    className={`text-xs ${i <= Math.round(review.quality!) ? 'text-[#f2cc0d]' : 'text-[#dee2e6]'}`}
                                  >
                                    {'\u2605'}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-[10px] text-[#adb5bd]">
                              {new Date(review.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-[#495057] leading-relaxed">&ldquo;{review.note}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Niches */}
                {sc.niches && sc.niches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sc.niches.map((niche) => (
                      <span
                        key={niche}
                        className="px-2.5 py-1 bg-[#f2cc0d]/10 rounded-full text-xs font-medium text-[#946f00] border border-[#f2cc0d]/20"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                )}

                {/* Info details */}
                <div className="space-y-2 text-sm">
                  {(sc.city || sc.country) && (
                    <div className="flex items-center gap-2 text-[#495057]">
                      <svg className="w-4 h-4 text-[#adb5bd] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {[sc.city, sc.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {sc.age_range && (
                    <div className="flex items-center gap-2 text-[#495057]">
                      <svg className="w-4 h-4 text-[#adb5bd] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      גיל {sc.age_range}
                      {sc.gender && (
                        <span className="text-[#adb5bd]">
                          {' \u00B7 '}{sc.gender === 'female' ? 'נקבה' : sc.gender === 'male' ? 'זכר' : 'אחר'}
                        </span>
                      )}
                    </div>
                  )}
                  {sc.users_profiles?.language && (
                    <div className="flex items-center gap-2 text-[#495057]">
                      <svg className="w-4 h-4 text-[#adb5bd] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {LANG_LABELS[sc.users_profiles.language] || sc.users_profiles.language}
                    </div>
                  )}
                  {scJoinDate && (
                    <div className="flex items-center gap-2 text-[#495057]">
                      <svg className="w-4 h-4 text-[#adb5bd] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      הצטרפות: {scJoinDate}
                    </div>
                  )}
                </div>

                {/* Highlights / Key Points */}
                {sc.highlights && sc.highlights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-[#868e96] uppercase tracking-wide">נקודות חשובות</h4>
                    <div className="space-y-1.5">
                      {sc.highlights.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-[#495057]">
                          <span className="text-[#f2cc0d] mt-0.5 flex-shrink-0">{'\u2726'}</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platforms with profile links */}
                {sc.platforms && Object.keys(sc.platforms).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-[#868e96] uppercase tracking-wide">רשתות חברתיות</h4>
                      <span className="text-xs font-bold text-[#f2cc0d]">
                        {formatFollowers(getTotalFollowers(sc.platforms))} עוקבים
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(sc.platforms).map(([name, data]) => {
                        if (!data) return null;
                        const handle = data.handle || data.username;
                        const profileUrl = handle && PLATFORM_URLS[name] ? PLATFORM_URLS[name](handle) : null;
                        const color = getPlatformColor(name);
                        return (
                          <a
                            key={name}
                            href={profileUrl || '#'}
                            target={profileUrl ? '_blank' : undefined}
                            rel={profileUrl ? 'noopener noreferrer' : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!profileUrl) e.preventDefault();
                            }}
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all ${
                              profileUrl
                                ? 'bg-white border-[#e9ecef] hover:border-[#f2cc0d] hover:shadow-sm cursor-pointer'
                                : 'bg-[#f8f9fa] border-[#f1f3f5] cursor-default'
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${color}12` }}
                            >
                              <span style={{ color }}>
                                <PlatformIcon name={name} className="w-5 h-5" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#212529]">{name}</div>
                              {handle && (
                                <div className="text-xs text-[#868e96] truncate">@{handle}</div>
                              )}
                            </div>
                            {data.followers != null && (
                              <div className="text-left flex-shrink-0">
                                <div className="text-sm font-bold text-[#212529]">{formatFollowers(data.followers)}</div>
                                <div className="text-[10px] text-[#adb5bd]">עוקבים</div>
                              </div>
                            )}
                            {profileUrl && (
                              <svg className="w-4 h-4 text-[#dee2e6] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Portfolio Links */}
                {sc.portfolio_links && sc.portfolio_links.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-[#868e96] uppercase tracking-wide">קישורים לתיק עבודות</h4>
                    <div className="space-y-1.5">
                      {sc.portfolio_links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 py-2 px-3 bg-[#f8f9fa] rounded-lg text-sm text-[#495057] hover:text-[#f2cc0d] hover:bg-[#f8f9fa]/80 transition-colors"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="truncate">{link.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task History Summary */}
                {!loadingDetail && creatorDetail?.taskSummary && creatorDetail.taskSummary.total > 0 && (
                  <div className="bg-[#f8f9fa] rounded-xl p-4">
                    <h4 className="text-xs font-medium text-[#868e96] uppercase tracking-wide mb-2">היסטוריית עבודה</h4>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span>
                        <span className="font-bold text-[#212529]">{creatorDetail.taskSummary.total}</span>
                        <span className="text-[#868e96] mr-1">משימות</span>
                      </span>
                      <span className="text-[#dee2e6]">{'\u00B7'}</span>
                      <span>
                        <span className="font-bold text-emerald-600">{creatorDetail.taskSummary.approved}</span>
                        <span className="text-[#868e96] mr-1">אושרו</span>
                      </span>
                      {creatorDetail.taskSummary.inProgress > 0 && (
                        <>
                          <span className="text-[#dee2e6]">{'\u00B7'}</span>
                          <span>
                            <span className="font-bold text-blue-500">{creatorDetail.taskSummary.inProgress}</span>
                            <span className="text-[#868e96] mr-1">בתהליך</span>
                          </span>
                        </>
                      )}
                      {creatorDetail.taskSummary.disputed > 0 && (
                        <>
                          <span className="text-[#dee2e6]">{'\u00B7'}</span>
                          <span>
                            <span className="font-bold text-red-500">{creatorDetail.taskSummary.disputed}</span>
                            <span className="text-[#868e96] mr-1">מחלוקות</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
