'use client';

import { useRouter } from 'next/navigation';

interface Creator {
  user_id: string;
  avatar_url: string | null;
  display_name: string;
  niches?: string[];
  tier?: string;
  total_followers?: number;
  average_rating?: number | null;
  total_tasks?: number;
  is_brand_creator?: boolean;
}

interface DashboardCreatorNetworkProps {
  creators: Creator[];
}

// Scattered positions for up to 10 avatars — varied sizes for depth effect
const AVATAR_LAYOUT = [
  { top: '15%', right: '10%', size: 58 },
  { top: '10%', right: '50%', size: 50 },
  { top: '38%', right: '30%', size: 54 },
  { top: '28%', right: '72%', size: 46 },
  { top: '58%', right: '14%', size: 50 },
  { top: '55%', right: '56%', size: 42 },
  { top: '75%', right: '34%', size: 46 },
  { top: '72%', right: '76%', size: 42 },
  { top: '45%', right: '88%', size: 40 },
  { top: '85%', right: '58%', size: 38 },
];

const AVATAR_COLORS = [
  '#8e33f5', '#ef767a', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#f2cc0d', '#14b8a6', '#f97316',
];

// SVG connection lines between avatar positions (index pairs)
const CONNECTIONS = [
  [0, 2], [1, 3], [2, 4], [3, 5], [1, 2], [4, 6], [5, 7], [0, 1], [6, 9], [8, 5],
];

const TIER_LABELS: Record<string, string> = {
  elite: 'Elite',
  pro: 'Pro',
  verified: 'Verified',
  starter: 'Starter',
};

const TIER_COLORS: Record<string, string> = {
  elite: '#f59e0b',
  pro: '#8b5cf6',
  verified: '#3b82f6',
  starter: '#6b7280',
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return n.toString();
}

export function DashboardCreatorNetwork({ creators }: DashboardCreatorNetworkProps) {
  const router = useRouter();
  const displayCreators = creators.slice(0, 10);

  const handleClick = (userId: string) => {
    router.push(`/brand/creators?open=${userId}`);
  };

  return (
    <div className="bg-[#e5f2d6] rounded-2xl p-5 relative overflow-hidden" style={{ height: 320 }}>
      {/* SVG decorative rings + connection lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 320"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background rings */}
        <circle cx="200" cy="160" r="50" stroke="#4a7c3f" strokeWidth="0.5" opacity="0.15" />
        <circle cx="200" cy="160" r="90" stroke="#4a7c3f" strokeWidth="0.5" opacity="0.12" />
        <circle cx="200" cy="160" r="130" stroke="#4a7c3f" strokeWidth="0.5" opacity="0.08" />

        {/* Connection lines between creators */}
        {displayCreators.length >= 2 && CONNECTIONS.map(([a, b], i) => {
          if (a >= displayCreators.length || b >= displayCreators.length) return null;
          const posA = AVATAR_LAYOUT[a];
          const posB = AVATAR_LAYOUT[b];
          const x1 = 400 - (parseFloat(posA.right) / 100) * 400;
          const y1 = (parseFloat(posA.top) / 100) * 320;
          const x2 = 400 - (parseFloat(posB.right) / 100) * 400;
          const y2 = (parseFloat(posB.top) / 100) * 320;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#4a7c3f"
              strokeWidth="1"
              opacity="0.15"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {/* Title badge */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <span className="inline-block border border-[#b8d4a8] rounded-md px-2 py-1 text-sm text-[#4a7c3f]">
          רשת יוצרים
        </span>
        {displayCreators.length > 0 && (
          <button
            onClick={() => router.push('/brand/creators')}
            className="text-xs text-[#4a7c3f] hover:text-[#3a6830] transition-colors font-medium"
          >
            הצג הכל →
          </button>
        )}
      </div>

      {/* Creator avatars */}
      {displayCreators.map((creator, i) => {
        const layout = AVATAR_LAYOUT[i];
        const initial = creator.display_name?.charAt(0)?.toUpperCase() || '?';
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
        const tierColor = TIER_COLORS[creator.tier || 'starter'];

        return (
          <button
            key={creator.user_id}
            onClick={() => handleClick(creator.user_id)}
            className="absolute z-10 rounded-full border-[2.5px] border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.15] hover:shadow-xl hover:z-30 group"
            style={{
              top: layout.top,
              right: layout.right,
              width: layout.size,
              height: layout.size,
            }}
          >
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatar_url}
                alt={creator.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: color, fontSize: layout.size * 0.38 }}
              >
                {initial}
              </div>
            )}

            {/* Brand creator indicator */}
            {creator.is_brand_creator && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f2cc0d] rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}

            {/* Rich hover tooltip */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-40">
              <div className="bg-white rounded-xl shadow-2xl border border-[#e9ecef] p-3 min-w-[180px] text-right">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#212529] truncate">{creator.display_name}</div>
                    {creator.tier && (
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: tierColor }}
                      >
                        {TIER_LABELS[creator.tier] || creator.tier}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[11px] text-[#6c757d] mt-1">
                  {(creator.total_followers ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-bold text-[#212529]">{formatFollowers(creator.total_followers!)}</span>
                    </span>
                  )}
                  {creator.average_rating != null && creator.average_rating > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span className="text-[#f2cc0d]">&#9733;</span>
                      <span className="font-bold text-[#212529]">{creator.average_rating.toFixed(1)}</span>
                    </span>
                  )}
                  {(creator.total_tasks ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-bold text-[#212529]">{creator.total_tasks}</span>
                    </span>
                  )}
                </div>

                {/* Niches */}
                {creator.niches && creator.niches.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {creator.niches.slice(0, 2).map((n) => (
                      <span
                        key={n}
                        className="px-1.5 py-0.5 bg-[#f2cc0d]/10 rounded text-[10px] font-medium text-[#946f00]"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}

                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-r border-[#e9ecef] rotate-[-135deg]" />
              </div>
            </div>
          </button>
        );
      })}

      {/* Empty state */}
      {displayCreators.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3">
          <div className="w-16 h-16 rounded-full bg-[#d4e8c4] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#4a7c3f] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-[#4a7c3f] text-sm">עדיין אין יוצרים ברשת</p>
          <button
            onClick={() => router.push('/brand/creators')}
            className="text-xs font-medium text-[#4a7c3f] hover:text-[#3a6830] underline transition-colors"
          >
            גלה יוצרים במאגר
          </button>
        </div>
      )}
    </div>
  );
}
