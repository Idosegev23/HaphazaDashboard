import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only handle Supabase auth - no i18n routing since pages are not in [locale] folders
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
