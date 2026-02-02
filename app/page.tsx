import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/get-user';

export default async function HomePage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Redirect based on role
  if (!user.role) {
    redirect('/onboarding');
  }

  // Admin routes
  if (['admin', 'finance', 'support', 'content_ops'].includes(user.role)) {
    redirect('/admin/dashboard');
  }

  // Brand routes
  if (['brand_manager', 'brand_user'].includes(user.role)) {
    redirect('/brand/dashboard');
  }

  // Creator routes
  if (user.role === 'creator') {
    redirect('/creator/dashboard');
  }

  // Fallback
  redirect('/onboarding');
}
