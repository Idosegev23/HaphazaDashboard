'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface CampaignNavProps {
  campaignId: string;
  activeSection?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: string;
  href?: string;
  isInternal?: boolean;
}

export function CampaignNav({ campaignId, activeSection = 'details' }: CampaignNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const sections: NavSection[] = [
    { id: 'details', label: 'פרטי קמפיין', icon: 'info', isInternal: true },
    { id: 'products', label: 'מוצרים', icon: 'inventory', isInternal: true },
    { id: 'applicants', label: 'בחירת משפיענים', icon: 'group', href: `/brand/applications?campaign=${campaignId}` },
    { id: 'content', label: 'ניהול תכנים', icon: 'video_library', href: `/brand/tasks?campaign=${campaignId}` },
    { id: 'shipping', label: 'משלוחים', icon: 'local_shipping', href: `/brand/shipping?campaign=${campaignId}` },
    { id: 'payments', label: 'תשלומים', icon: 'payments', href: `/brand/payments?campaign=${campaignId}` },
  ];

  const handleInternalNavigation = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="bg-white border border-[#dee2e6] rounded-lg p-4 sticky top-24">
      <h3 className="text-[#212529] font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined">menu</span>
        ניווט
      </h3>
      <div className="space-y-2">
        {sections.map((section) => {
          const isActive = section.isInternal 
            ? activeSection === section.id 
            : pathname.includes(section.href?.split('?')[0] || '');
          
          if (section.isInternal) {
            return (
              <button
                key={section.id}
                onClick={() => handleInternalNavigation(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-right',
                  isActive
                    ? 'bg-[#f2cc0d] text-black font-medium'
                    : 'text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#212529]'
                )}
              >
                <span className="material-symbols-outlined text-xl">
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={section.id}
              href={section.href!}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all',
                isActive
                  ? 'bg-[#f2cc0d] text-black font-medium'
                  : 'text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#212529]'
              )}
            >
              <span className="material-symbols-outlined text-xl">
                {section.icon}
              </span>
              <span>{section.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
