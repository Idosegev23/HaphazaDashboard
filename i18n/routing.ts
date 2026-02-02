import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // Hebrew is the default language
  locales: ['he', 'en'],
  defaultLocale: 'he',
  // Never add locale prefix to URLs since our pages are not in [locale] folders
  localePrefix: 'never',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
