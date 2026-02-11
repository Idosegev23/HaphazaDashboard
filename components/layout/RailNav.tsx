'use client';

import { UserWithRole } from '@/hooks/use-user';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface RailNavProps {
  user: UserWithRole | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function RailNav({ user }: RailNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Define navigation based on role
  const getNavItems = (): NavItem[] => {
    if (!user?.role) return [];

    if (user.role === 'creator') {
      return [
        { href: '/creator/dashboard', label: 'לוח בקרה', icon: '📊' },
        { href: '/creator/campaigns', label: 'קמפיינים', icon: '🎯' },
        { href: '/creator/tasks', label: 'משימות', icon: '📋' },
        { href: '/creator/shipping', label: 'משלוחים', icon: '📦' },
        { href: '/creator/payments', label: 'תשלומים', icon: '💰' },
        { href: '/creator/settings', label: 'הגדרות', icon: '⚙️' },
      ];
    }

    if (['brand_manager', 'brand_user'].includes(user.role)) {
      return [
        { href: '/brand/dashboard', label: 'לוח בקרה', icon: '📊' },
        { href: '/brand/campaigns', label: 'קמפיינים', icon: '🎯' },
      ];
    }

    if (['admin', 'finance', 'support', 'content_ops'].includes(user.role)) {
      return [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '⚙️' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/campaigns', label: 'Campaigns', icon: '🎯' },
        { href: '/admin/payments', label: 'Payments', icon: '💰' },
        { href: '/admin/templates', label: 'Templates', icon: '📄' },
        { href: '/admin/logs', label: 'Logs', icon: '📋' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <nav className="w-20 bg-[#1E1E1E] border-r border-[#494222] flex flex-col items-center py-6 gap-6">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold text-[#f2cc0d] mb-4">
        L
      </Link>

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center transition-all',
              pathname === item.href
                ? 'bg-[#f2cc0d] text-[#121212]'
                : 'text-[#cbc190] hover:bg-[#2e2a1b]'
            )}
            title={item.label}
          >
            <span className="text-xl">{item.icon}</span>
          </Link>
        ))}
      </div>

      {/* User menu */}
      <div className="flex flex-col gap-4 items-center">
        <div className="w-10 h-10 rounded-full bg-[#2e2a1b] flex items-center justify-center text-[#f2cc0d] text-sm font-bold">
          {user?.profile?.display_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <button
          onClick={handleLogout}
          className="text-[#cbc190] hover:text-white transition-colors text-xl"
          title="יציאה"
        >
          🚪
        </button>
      </div>
    </nav>
  );
}
