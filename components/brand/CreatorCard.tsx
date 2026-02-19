'use client';

import { TierBadge, TierLevel } from '@/components/ui/TierBadge';

export type PortfolioPreview = {
  id: string;
  media_url: string;
  media_type: string;
  title: string;
};

export type CatalogCreator = {
  user_id: string;
  bio: string | null;
  city: string | null;
  niches: string[] | null;
  tier: string | null;
  platforms: Record<string, { handle?: string; username?: string; followers?: number }> | null;
  gender: string | null;
  country: string | null;
  age_range: string | null;
  verified_at: string | null;
  created_at: string | null;
  occupations: string[] | null;
  portfolio_links: string[] | null;
  highlights: string[] | null;
  users_profiles: {
    display_name: string;
    avatar_url: string | null;
    language: string | null;
  } | null;
  creator_metrics: Array<{
    average_rating: number | null;
    total_tasks: number | null;
    approval_rate: number | null;
    on_time_rate: number | null;
    on_time_deliveries: number | null;
    late_deliveries: number | null;
    approved_tasks: number | null;
    rejected_tasks: number | null;
  }> | null;
  portfolio_preview?: PortfolioPreview[];
};

type CreatorCardProps = {
  creator: CatalogCreator;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
};

export function getTotalFollowers(platforms: CatalogCreator['platforms']): number {
  if (!platforms) return 0;
  return Object.values(platforms).reduce((sum, p) => sum + (p?.followers || 0), 0);
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function StarRating({ rating }: { rating: number | null }) {
  const stars = Math.round((rating || 0) * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= stars ? 'text-[#f2cc0d]' : 'text-[#dee2e6]'}`}
        >
          {i <= stars ? '\u2605' : '\u2606'}
        </span>
      ))}
      {rating !== null && (
        <span className="text-xs text-[#6c757d] mr-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export function PlatformIcon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const key = name.toLowerCase();
  switch (key) {
    case 'instagram':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.17V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'twitter/x':
    case 'x':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'threads':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.773.783c-1.022-3.67-3.553-5.456-7.55-5.477-2.73.02-4.775.91-6.085 2.646-1.235 1.638-1.882 4.01-1.906 7.037V12.574c.03 4.96 2.086 7.94 7.992 7.965 2.058-.01 3.636-.476 4.83-1.42 1.26-1 1.92-2.42 1.92-4.12 0-1.3-.4-2.32-1.19-3.05-.76-.69-1.83-1.09-3.16-1.17a9.3 9.3 0 00-.65-.02c-1.37 0-2.46.32-3.22.94-.69.56-1.06 1.33-1.06 2.22 0 .87.33 1.58.97 2.09.61.48 1.44.74 2.41.74h.08l-.01 2.67h-.07c-1.7 0-3.19-.46-4.32-1.32-1.2-.93-1.85-2.26-1.85-3.84 0-1.7.66-3.12 1.92-4.11 1.16-.91 2.7-1.39 4.45-1.39.23 0 .47.01.71.03 1.87.11 3.42.71 4.58 1.77 1.22 1.12 1.84 2.66 1.84 4.58 0 2.33-.93 4.26-2.69 5.57-1.57 1.17-3.6 1.78-6.04 1.79z" />
        </svg>
      );
    default:
      return <span className={`font-bold text-[10px]`}>{name.slice(0, 2).toUpperCase()}</span>;
  }
}

// Brand-colored versions for platform icons
const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  tiktok: '#000000',
  youtube: '#FF0000',
  facebook: '#1877F2',
  'twitter/x': '#000000',
  x: '#000000',
  linkedin: '#0A66C2',
  threads: '#000000',
};

export function getPlatformColor(name: string): string {
  return PLATFORM_COLORS[name.toLowerCase()] || '#6c757d';
}

// Keep backwards compat export
export const PLATFORM_ICONS: Record<string, string> = {
  Instagram: 'IG',
  TikTok: 'TT',
  YouTube: 'YT',
  Facebook: 'FB',
  'Twitter/X': 'X',
  LinkedIn: 'LI',
  Threads: 'TH',
};


export function CreatorCard({ creator, onClick, isFavorite, onToggleFavorite }: CreatorCardProps) {
  const profile = creator.users_profiles;
  const metrics = creator.creator_metrics?.[0];
  const totalFollowers = getTotalFollowers(creator.platforms);
  const displayName = profile?.display_name || 'ללא שם';
  const portfolio = creator.portfolio_preview || [];
  const heroItem = portfolio[0];
  const thumbnails = portfolio.slice(1, 4);
  const extraCount = portfolio.length > 4 ? portfolio.length - 4 : 0;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden bg-white border border-[#e5e7eb] shadow-sm hover:shadow-xl hover:border-[#f2cc0d]/60 transition-all duration-300 cursor-pointer hover:-translate-y-1"
      onClick={onClick}
    >
      {/* === HERO CONTENT AREA === */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
        {heroItem ? (
          <>
            {heroItem.media_type === 'video' ? (
              <video
                src={heroItem.media_url}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={heroItem.media_url}
                alt={heroItem.title || displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            )}
            {/* Video play icon overlay */}
            {heroItem.media_type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </>
        ) : profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl font-bold text-[#dee2e6]">
              {displayName.charAt(0)}
            </span>
          </div>
        )}

        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

        {/* Favorite button - top left */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/40 hover:scale-110"
            title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
          >
            <span className="text-lg">
              {isFavorite ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
            </span>
          </button>
        )}

        {/* Content count badge - top left */}
        {portfolio.length > 1 && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {portfolio.length}
          </div>
        )}

        {/* Verified badge */}
        {creator.verified_at && (
          <div className="absolute top-14 left-3 z-10 px-2 py-0.5 bg-[#f2cc0d]/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-black">
            VERIFIED
          </div>
        )}

        {/* Creator info overlay on hero bottom */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-4">
          <div className="flex items-end gap-3">
            {/* Small avatar */}
            <div
              className={`w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 ${
                creator.verified_at ? 'border-[#f2cc0d]' : 'border-white/60'
              } shadow-lg`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-lg truncate drop-shadow-sm">
                  {displayName}
                </h3>
                {creator.tier && (
                  <TierBadge
                    tier={creator.tier as TierLevel}
                    showTooltip={false}
                    showLabel={false}
                    className="scale-75"
                  />
                )}
              </div>
              {/* Compact star rating on hero */}
              {metrics?.average_rating != null && metrics.average_rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[#f2cc0d] text-sm">{'\u2605'}</span>
                  <span className="text-white/90 text-sm font-medium">
                    {metrics.average_rating.toFixed(1)}
                  </span>
                  {metrics.total_tasks != null && metrics.total_tasks > 0 && (
                    <span className="text-white/60 text-xs">
                      ({metrics.total_tasks} עבודות)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === THUMBNAIL STRIP === */}
      {thumbnails.length > 0 && (
        <div className="flex gap-1 p-1.5 bg-[#f8f9fa]">
          {thumbnails.map((item) => (
            <div
              key={item.id}
              className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-[#e9ecef]"
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
                    <div className="w-6 h-6 bg-black/40 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
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
                  loading="lazy"
                />
              )}
            </div>
          ))}
          {extraCount > 0 && (
            <div className="flex-1 aspect-square rounded-lg bg-[#e9ecef] flex items-center justify-center">
              <span className="text-sm font-bold text-[#6c757d]">+{extraCount}</span>
            </div>
          )}
        </div>
      )}

      {/* === INFO STRIP === */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Platforms row */}
        {creator.platforms && Object.keys(creator.platforms).length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(creator.platforms).map(([name, data]) => {
              if (!data?.followers) return null;
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f1f3f5] text-[#495057] border border-[#e9ecef]"
                >
                  <span style={{ color: getPlatformColor(name) }}>
                    <PlatformIcon name={name} className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[#868e96]">{formatFollowers(data.followers)}</span>
                </span>
              );
            })}
            {totalFollowers > 0 && (
              <span className="mr-auto text-[11px] font-bold text-[#f2cc0d]">
                {formatFollowers(totalFollowers)} total
              </span>
            )}
          </div>
        )}

        {/* Niches */}
        {creator.niches && creator.niches.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {creator.niches.slice(0, 3).map((niche) => (
              <span
                key={niche}
                className="px-2 py-0.5 bg-[#f2cc0d]/10 rounded-full text-[11px] font-medium text-[#946f00] border border-[#f2cc0d]/20"
              >
                {niche}
              </span>
            ))}
            {creator.niches.length > 3 && (
              <span className="px-2 py-0.5 text-[11px] text-[#868e96]">
                +{creator.niches.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Location + Stats row */}
        <div className="flex items-center gap-2 text-[11px] text-[#868e96]">
          {(creator.city || creator.country) && (
            <span className="truncate">
              {[creator.city, creator.country].filter(Boolean).join(', ')}
            </span>
          )}
          {metrics?.approval_rate != null && metrics.approval_rate > 0 && (
            <>
              <span className="text-[#dee2e6]">{'\u00B7'}</span>
              <span className="text-emerald-600 font-medium">
                {Math.round(metrics.approval_rate)}% אישור
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
