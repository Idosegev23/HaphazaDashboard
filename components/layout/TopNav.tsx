'use client';

import { UserWithRole } from '@/hooks/use-user';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';
import { NotificationBell } from './NotificationBell';

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

  const isBrandUser = user?.role === 'brand_manager' || user?.role === 'brand_user';

  // Define navigation based on role
  const getNavItems = (): NavItem[] => {
    if (!user?.role) return [];

    if (user.role === 'creator') {
      return [
        { href: '/creator/dashboard', label: 'לוח בקרה', icon: '' },
        { href: '/creator/campaigns', label: 'קמפיינים פתוחים', icon: '' },
        { href: '/creator/applications', label: 'המועמדויות שלי', icon: '' },
        { href: '/creator/tasks', label: 'העבודות שלי', icon: '' },
        { href: '/creator/portfolio', label: 'תיק עבודות', icon: '' },
        { href: '/creator/shipping', label: 'משלוחים', icon: '' },
        { href: '/creator/payments', label: 'תשלומים', icon: '' },
        { href: '/creator/settings', label: 'הגדרות', icon: '' },
      ];
    }

    if (['brand_manager', 'brand_user'].includes(user.role)) {
      return [
        { href: '/brand/dashboard', label: 'לוח בקרה', icon: '' },
        { href: '/brand/campaigns', label: 'הקמפיינים שלי', icon: '' },
        { href: '/brand/creators', label: 'קטלוג יוצרים', icon: '' },
      ];
    }

    if (['admin', 'finance', 'support', 'content_ops'].includes(user.role)) {
      return [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '' },
        { href: '/admin/users', label: 'Users', icon: '' },
        { href: '/admin/campaigns', label: 'Campaigns', icon: '' },
        { href: '/admin/payments', label: 'Payments', icon: '' },
        { href: '/admin/templates', label: 'Templates', icon: '' },
        { href: '/admin/logs', label: 'Logs', icon: '' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  // Brand-specific nav variant
  if (isBrandUser) {
    return (
      <>
        <header
          className="sticky top-0 z-50 w-full border-b border-[#dfdfdf] bg-white"
          style={{ fontFamily: 'var(--font-assistant)' }}
        >
          <div className="flex items-center justify-between px-6 py-3 lg:px-10">
            {/* Right side (RTL): Logo & branding */}
            <div className="flex items-center gap-3">
              <Link href="/brand/dashboard" className="flex flex-col">
                <span className="text-xl font-bold text-[#212529] tracking-tight">Leaders</span>
                <span className="text-[10px] text-[#6b7281] -mt-1">Powered By Stagwell</span>
              </Link>
            </div>

            {/* Center: Nav pills */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-medium transition-all',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-[#e5f2d6] text-[#212529]'
                      : 'bg-white border border-[#dfdfdf] text-[#6b7281] hover:bg-[#f4f5f7] hover:text-[#212529]'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Left side (RTL): Avatar + name + exit */}
            <div className="flex items-center gap-3">
              {user && <NotificationBell />}

              <div className="hidden sm:flex items-center gap-3">
                <div className="hidden md:block text-start">
                  <div className="text-sm font-medium text-[#212529]">
                    {user?.profile?.display_name}
                  </div>
                  <div className="text-xs text-[#6b7281]">
                    {user?.role === 'brand_manager' ? 'מנהל מותג' : 'משתמש מותג'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              {/* Exit button */}
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full border border-[#dfdfdf] text-[#6b7281] hover:bg-[#f4f5f7] hover:text-[#212529] transition-all"
                title="יציאה"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full text-[#6b7281] hover:bg-[#f4f5f7] transition-all"
                aria-label="תפריט"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-[#dfdfdf] bg-white">
              <nav className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-full transition-all',
                      pathname === item.href
                        ? 'bg-[#e5f2d6] text-[#212529] font-medium'
                        : 'text-[#6b7281] hover:bg-[#f4f5f7] hover:text-[#212529]'
                    )}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-[#6b7281] hover:bg-[#f4f5f7] hover:text-[#212529] transition-all"
                >
                  <span>יציאה</span>
                </button>
              </nav>
            </div>
          )}
        </header>
      </>
    );
  }

  // Default nav for non-brand users
  return (
    <>
      {/* Desktop & Mobile Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-[#dee2e6] bg-white/95 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center">
                <span className="text-2xl font-bold text-[#121212]">L</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-gold">
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
                    ? 'bg-gold text-[#121212]'
                    : 'text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#212529]'
                )}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            {user && <NotificationBell />}

            {/* User Info - Hidden on smallest screens */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f8f9fa] flex items-center justify-center border-2 border-gold">
                <span className="text-gold text-sm font-bold">
                  {user?.profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-[#212529]">
                  {user?.profile?.display_name}
                </div>
                <div className="text-xs text-[#6c757d]">
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
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#212529] transition-all"
              title="יציאה"
            >
              <span className="text-sm">יציאה</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gold hover:bg-white/5 transition-all"
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
          <div className="lg:hidden border-t border-[#dee2e6] bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    pathname === item.href
                      ? 'bg-gold text-[#121212] font-medium'
                      : 'text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#212529]'
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Mobile Logout */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#212529] transition-all"
              >
                <span>יציאה</span>
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
