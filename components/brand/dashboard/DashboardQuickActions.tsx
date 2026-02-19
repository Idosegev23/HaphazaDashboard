import Link from 'next/link';
import { SectionBadge } from './SectionBadge';

export function DashboardQuickActions() {
  return (
    <div className="bg-[#dbe4f5] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex justify-end">
        <SectionBadge label="פעולות מהירות" />
      </div>

      <div className="flex flex-col gap-3">
        {/* Review applications */}
        <Link
          href="/brand/applications"
          className="flex items-center gap-3 bg-white rounded-full px-5 py-3 text-[#212529] font-medium hover:brightness-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>סקירת בקשות</span>
        </Link>

        {/* New campaign */}
        <Link
          href="/brand/campaigns/new"
          className="flex items-center gap-3 bg-[#e5f2d6] rounded-full px-5 py-3 text-[#212529] font-medium hover:brightness-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>+ קמפיין חדש</span>
        </Link>

        {/* Approved content */}
        <Link
          href="/brand/assets"
          className="flex items-center gap-3 bg-white rounded-full px-5 py-3 text-[#212529] font-medium hover:brightness-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>תוכן מאושר</span>
        </Link>
      </div>
    </div>
  );
}
