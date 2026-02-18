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
                  <span className="font-bold">{PLATFORM_ICONS[name] || name}</span>
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
