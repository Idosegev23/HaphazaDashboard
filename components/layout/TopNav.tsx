'use client';

import { UserWithRole } from '@/hooks/use-user';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

interface TopNavProps {
  user: UserWithRole | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        { href: '/creator/applications', label: 'הבקשות שלי', icon: '📝' },
        { href: '/creator/tasks', label: 'משימות', icon: '📋' },
        { href: '/creator/shipping', label: 'משלוחים', icon: '📦' },
        { href: '/creator/payments', label: 'תשלומים', icon: '💰' },
      ];
    }

    if (['brand_manager', 'brand_user'].includes(user.role)) {
      return [
        { href: '/brand/dashboard', label: 'לוח בקרה', icon: '📊' },
        { href: '/brand/campaigns', label: 'קמפיינים', icon: '🎯' },
        { href: '/brand/applications', label: 'בקשות', icon: '📝' },
        { href: '/brand/tasks', label: 'משימות', icon: '📋' },
        { href: '/brand/assets', label: 'תוכן מאושר', icon: '🎬' },
        { href: '/brand/shipping', label: 'משלוחים', icon: '📦' },
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
    <>
      {/* Desktop & Mobile Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-[#494222] bg-[#1E1E1E] shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f2cc0d] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#121212]">L</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-[#f2cc0d]">
                LEADERS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium',
                  pathname === item.href
                    ? 'bg-[#f2cc0d] text-[#121212]'
                    : 'text-[#cbc190] hover:bg-[#2e2a1b] hover:text-white'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* User Info - Hidden on smallest screens */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2e2a1b] flex items-center justify-center border-2 border-[#f2cc0d]">
                <span className="text-[#f2cc0d] text-sm font-bold">
                  {user?.profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-white">
                  {user?.profile?.display_name}
                </div>
                <div className="text-xs text-[#cbc190]">
                  {user?.role === 'creator' ? 'משפיען' : 
                   user?.role === 'brand_manager' ? 'מנהל מותג' : 
                   user?.role === 'brand_user' ? 'משתמש מותג' : 
                   user?.role}
                </div>
              </div>
            </div>

            {/* Logout Button - Desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-[#cbc190] hover:bg-[#2e2a1b] hover:text-white transition-all"
              title="יציאה"
            >
              <span>🚪</span>
              <span className="text-sm">יציאה</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#f2cc0d] hover:bg-[#2e2a1b] transition-all"
              aria-label="תפריט"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#494222] bg-[#232010]">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    pathname === item.href
                      ? 'bg-[#f2cc0d] text-[#121212] font-medium'
                      : 'text-[#cbc190] hover:bg-[#2e2a1b] hover:text-white'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile Logout */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#cbc190] hover:bg-[#2e2a1b] hover:text-white transition-all"
              >
                <span className="text-xl">🚪</span>
                <span>יציאה</span>
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
