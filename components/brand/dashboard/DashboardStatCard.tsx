import Link from 'next/link';
import { SectionBadge } from './SectionBadge';

interface DashboardStatCardProps {
  label: string;
  value: number;
  href?: string;
}

export function DashboardStatCard({ label, value, href }: DashboardStatCardProps) {
  const content = (
    <div className="bg-white rounded-2xl p-5 flex flex-col justify-between h-full" style={{ minHeight: 150 }}>
      <div className="flex items-start justify-end">
        <SectionBadge label={label} />
      </div>

      <div className="flex items-end justify-between mt-auto">
        {/* Chevron arrow */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[#6b7281]"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span
          className="font-medium text-[#212529] leading-none"
          style={{ fontSize: 99 }}
        >
          {value}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:scale-[1.02] transition-transform">
        {content}
      </Link>
    );
  }

  return content;
}
