import Link from 'next/link';
import { SectionBadge } from './SectionBadge';

interface DashboardProfileCardProps {
  displayName: string;
  role: string;
}

export function DashboardProfileCard({ displayName, role }: DashboardProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col justify-between" style={{ minHeight: 111 }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Grid icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#6b7281]">
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="1" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {/* Dots icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#6b7281]">
            <circle cx="3" cy="9" r="1.5" fill="currentColor" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            <circle cx="15" cy="9" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <SectionBadge label="לוח בקרה" />
      </div>

      <div className="flex items-end justify-between mt-3">
        <Link
          href="/brand/campaigns/new"
          className="flex items-center gap-1.5 bg-[#e5f2d6] text-[#212529] rounded-full px-4 py-2 text-sm font-semibold hover:brightness-95 transition-all"
        >
          <span>+</span>
          <span>קמפיין חדש</span>
        </Link>
        <div className="text-end">
          <h2 className="text-[36px] font-bold text-[#212529] leading-tight">{displayName}</h2>
          <p className="text-sm text-[#6b7281]">{role}</p>
        </div>
      </div>
    </div>
  );
}
