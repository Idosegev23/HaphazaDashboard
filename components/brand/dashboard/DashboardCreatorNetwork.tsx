'use client';

import { useRouter } from 'next/navigation';

interface Creator {
  user_id: string;
  avatar_url: string | null;
  display_name: string;
}

interface DashboardCreatorNetworkProps {
  creators: Creator[];
}

// Scattered positions for up to 8 avatars — varied sizes for depth effect
const AVATAR_LAYOUT = [
  { top: '18%', right: '8%', size: 56 },
  { top: '12%', right: '52%', size: 48 },
  { top: '42%', right: '28%', size: 52 },
  { top: '32%', right: '72%', size: 44 },
  { top: '62%', right: '12%', size: 48 },
  { top: '58%', right: '58%', size: 40 },
  { top: '78%', right: '36%', size: 44 },
  { top: '74%', right: '78%', size: 40 },
];

const AVATAR_COLORS = [
  '#8e33f5', '#ef767a', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#f2cc0d',
];

// SVG connection lines between avatar positions (index pairs)
const CONNECTIONS = [
  [0, 2], [1, 3], [2, 4], [3, 5], [1, 2], [4, 6], [5, 7], [0, 1],
];

export function DashboardCreatorNetwork({ creators }: DashboardCreatorNetworkProps) {
  const router = useRouter();
  const displayCreators = creators.slice(0, 8);

  const handleClick = (userId: string) => {
    router.push(`/brand/creators?open=${userId}`);
  };

  return (
    <div className="bg-[#e5f2d6] rounded-2xl p-5 relative overflow-hidden" style={{ height: 292 }}>
      {/* SVG decorative rings + connection lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 292"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background rings */}
        <circle cx="200" cy="146" r="50" stroke="#4a7c3f" strokeWidth="0.5" opacity="0.15" />
        <circle cx="200" cy="146" r="90" stroke="#4a7c3f" strokeWidth="0.5" opacity="0.12" />
        <circle cx="200" cy="146" r="130" stroke="#4a7c3f" strokeWidth="0.5" opacity="0.08" />

        {/* Connection lines between creators */}
        {displayCreators.length >= 2 && CONNECTIONS.map(([a, b], i) => {
          if (a >= displayCreators.length || b >= displayCreators.length) return null;
          const posA = AVATAR_LAYOUT[a];
          const posB = AVATAR_LAYOUT[b];
          // Convert percentage positions to SVG coords
          const x1 = 400 - (parseFloat(posA.right) / 100) * 400;
          const y1 = (parseFloat(posA.top) / 100) * 292;
          const x2 = 400 - (parseFloat(posB.right) / 100) * 400;
          const y2 = (parseFloat(posB.top) / 100) * 292;
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
      <div className="relative z-10 flex justify-end mb-2">
        <span className="inline-block border border-[#b8d4a8] rounded-md px-2 py-1 text-sm text-[#4a7c3f]">
          רשת יוצרים
        </span>
      </div>

      {/* Creator avatars */}
      {displayCreators.map((creator, i) => {
        const layout = AVATAR_LAYOUT[i];
        const initial = creator.display_name?.charAt(0)?.toUpperCase() || '?';
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

        return (
          <button
            key={creator.user_id}
            onClick={() => handleClick(creator.user_id)}
            className="absolute z-10 rounded-full border-[2.5px] border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-xl hover:z-20 group"
            style={{
              top: layout.top,
              right: layout.right,
              width: layout.size,
              height: layout.size,
            }}
            title={creator.display_name}
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

            {/* Name tooltip on hover */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="whitespace-nowrap bg-[#333]/80 text-white text-xs px-2 py-1 rounded-md">
                {creator.display_name}
              </span>
            </div>
          </button>
        );
      })}

      {/* Empty state */}
      {displayCreators.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-[#4a7c3f] text-sm">עדיין אין יוצרים ברשת</p>
        </div>
      )}
    </div>
  );
}
