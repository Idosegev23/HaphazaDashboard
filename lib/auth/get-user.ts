import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export type UserRole = Database['public']['Enums']['user_role'];

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole | null;
  profile: {
    display_name: string;
    language: 'he' | 'en';
    is_blocked: boolean;
  } | null;
  brand_id?: string | null;
}

/**
 * Gets the current user with their role and profile
 * Server-side only
 */
export async function getUser(): Promise<UserWithRole | null> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from('users_profiles')
    .select('display_name, language, is_blocked')
    .eq('user_id', user.id)
    .single();

  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    return null;
  }

  // Get user role - first check raw_user_meta_data (for admins), then memberships
  const roleFromMetadata = user.user_metadata?.role as UserRole | undefined;
  
  // Get user role from memberships (for brand/creator users)
  const { data: membership } = await supabase
    .from('memberships')
    .select('role, entity_id, entity_type')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Priority: metadata role (admin) > membership role > null
  const finalRole = roleFromMetadata || membership?.role || null;

  return {
    id: user.id,
    email: user.email!,
    role: finalRole,
    profile: profile ? {
      display_name: profile.display_name,
      language: profile.language || 'he',
      is_blocked: profile.is_blocked || false,
    } : null,
    brand_id: membership?.entity_type === 'brand' ? membership.entity_id : null,
  };
}

/**
 * Checks if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.role ? ['admin', 'finance', 'support', 'content_ops'].includes(user.role) : false;
}

/**
 * Checks if user is a creator
 */
export async function isCreator(): Promise<boolean> {
  const user = await getUser();
  return user?.role === 'creator';
}

/**
 * Checks if user is brand member
 */
export async function isBrandMember(): Promise<boolean> {
  const user = await getUser();
  return user?.role ? ['brand_manager', 'brand_user'].includes(user.role) : false;
}
