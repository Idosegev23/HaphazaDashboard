interface Creator {
  avatar_url: string | null;
  display_name: string;
}

interface DashboardCreatorNetworkProps {
  creators: Creator[];
}

const POSITIONS = [
  { top: '15%', right: '10%' },
  { top: '10%', right: '55%' },
  { top: '35%', right: '30%' },
  { top: '30%', right: '70%' },
  { top: '55%', right: '15%' },
  { top: '60%', right: '60%' },
  { top: '75%', right: '35%' },
  { top: '80%', right: '75%' },
];

const AVATAR_COLORS = [
  '#f2cc0d', '#ef767a', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1',
];

export function DashboardCreatorNetwork({ creators }: DashboardCreatorNetworkProps) {
  const displayCreators = creators.slice(0, 8);

  return (
    <div className="bg-[#e5f2d6] rounded-2xl p-5 relative overflow-hidden" style={{ height: 292 }}>
      {/* SVG circle rings decoration */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 400 292"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="200" cy="146" r="60" stroke="#4a7c3f" strokeWidth="1" />
        <circle cx="200" cy="146" r="100" stroke="#4a7c3f" strokeWidth="1" />
        <circle cx="200" cy="146" r="140" stroke="#4a7c3f" strokeWidth="0.5" />
      </svg>

      {/* Title badge */}
      <div className="relative z-10 flex justify-end mb-2">
        <span className="inline-block border border-[#b8d4a8] rounded-md px-2 py-1 text-sm text-[#4a7c3f]">
          רשת יוצרים
        </span>
      </div>

      {/* Creator avatars */}
      {displayCreators.map((creator, i) => {
        const pos = POSITIONS[i] || POSITIONS[0];
        const initial = creator.display_name?.charAt(0)?.toUpperCase() || '?';
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

        return (
          <div
            key={i}
            className="absolute z-10 w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden"
            style={{
              top: pos.top,
              right: pos.right,
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
                className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: color }}
              >
                {initial}
              </div>
            )}
          </div>
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
