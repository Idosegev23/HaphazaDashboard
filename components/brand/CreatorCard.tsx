'use client';

import { Card } from '@/components/ui/Card';
import { TierBadge, TierLevel } from '@/components/ui/TierBadge';

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
  users_profiles: {
    display_name: string;
    avatar_url: string | null;
    language: string | null;
  } | null;
  creator_metrics: Array<{
    average_rating: number | null;
    total_tasks: number | null;
    approval_rate: number | null;
  }> | null;
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

const LANG_LABELS: Record<string, string> = {
  he: 'עברית',
  en: 'English',
};

export function CreatorCard({ creator, onClick, isFavorite, onToggleFavorite }: CreatorCardProps) {
  const profile = creator.users_profiles;
  const metrics = creator.creator_metrics?.[0];
  const totalFollowers = getTotalFollowers(creator.platforms);
  const displayName = profile?.display_name || 'ללא שם';

  const joinDate = creator.created_at
    ? new Date(creator.created_at).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })
    : null;

  return (
    <Card
      hover
      className="relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-[#f2cc0d]"
      onClick={onClick}
    >
      {/* Verified stripe */}
      {creator.verified_at && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#f2cc0d]" />
      )}

      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className="absolute top-3 left-3 z-10 text-xl transition-transform hover:scale-110"
          title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          {isFavorite ? '\u2764\uFE0F' : '\u2661'}
        </button>
      )}

      <div className="flex flex-col gap-3">
        {/* Avatar + Name + Tier + Rating */}
        <div className="flex items-center gap-3">
          <div
            className={`w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 ${
              creator.verified_at ? 'border-[#f2cc0d]' : 'border-[#dee2e6]'
            }`}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center text-2xl text-[#6c757d]">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[#212529] font-bold text-lg truncate">{displayName}</h3>
              {creator.tier && (
                <TierBadge
                  tier={creator.tier as TierLevel}
                  showTooltip={false}
                  showLabel={false}
                  className="scale-75"
                />
              )}
            </div>
            <StarRating rating={metrics?.average_rating ?? null} />
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-[#6c757d] text-sm leading-relaxed line-clamp-2">
            {creator.bio}
          </p>
        )}

        {/* Info Grid: age, location, join date, campaigns */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {creator.age_range && (
            <div className="flex items-center gap-1 text-[#6c757d]">
              <span className="text-[#212529] font-medium">גיל:</span> {creator.age_range}
            </div>
          )}
          {(creator.city || creator.country) && (
            <div className="flex items-center gap-1 text-[#6c757d] truncate">
              <span className="text-[#212529] font-medium">מיקום:</span>
              {[creator.city, creator.country].filter(Boolean).join(', ')}
            </div>
          )}
          {joinDate && (
            <div className="flex items-center gap-1 text-[#6c757d]">
              <span className="text-[#212529] font-medium">הצטרפות:</span> {joinDate}
            </div>
          )}
          {metrics?.total_tasks != null && (
            <div className="flex items-center gap-1 text-[#6c757d]">
              <span className="text-[#212529] font-medium">קמפיינים:</span> {metrics.total_tasks}
            </div>
          )}
          {profile?.language && (
            <div className="flex items-center gap-1 text-[#6c757d]">
              <span className="text-[#212529] font-medium">שפה:</span> {LANG_LABELS[profile.language] || profile.language}
            </div>
          )}
        </div>

        {/* Niches */}
        {creator.niches && creator.niches.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {creator.niches.slice(0, 3).map((niche) => (
              <span
                key={niche}
                className="px-2 py-0.5 bg-[#f8f9fa] rounded-full text-xs text-[#212529] border border-[#dee2e6]"
              >
                {niche}
              </span>
            ))}
            {creator.niches.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-[#6c757d]">
                +{creator.niches.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Platforms */}
        {creator.platforms && Object.keys(creator.platforms).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(creator.platforms).map(([name, data]) => {
              if (!data?.followers) return null;
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#f8f9fa] rounded text-xs border border-[#dee2e6]"
                >
                  <span className="font-bold text-[#212529]">{PLATFORM_ICONS[name] || name}</span>
                  <span className="text-[#6c757d]">{formatFollowers(data.followers)}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Footer: Total Followers */}
        <div className="flex items-center justify-between pt-2 border-t border-[#dee2e6]">
          {totalFollowers > 0 && (
            <span className="text-xs font-medium text-[#f2cc0d]">
              {formatFollowers(totalFollowers)} עוקבים
            </span>
          )}
          {metrics?.approval_rate != null && metrics.approval_rate > 0 && (
            <span className="text-xs text-[#6c757d]">
              {Math.round(metrics.approval_rate)}% אישור
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
