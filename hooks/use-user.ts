'use client';

import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useEffect, useState } from 'react';

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
 * Client-side hook to get current user with role
 * Subscribes to auth state changes
 */
export function useUser() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from('users_profiles')
        .select('display_name, language, is_blocked')
        .eq('user_id', authUser.id)
        .single();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      // Get role
      const { data: membership } = await supabase
        .from('memberships')
        .select('role, entity_id, entity_type')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email!,
        role: membership?.role || null,
        profile: profile ? {
          display_name: profile.display_name,
          language: profile.language || 'he',
          is_blocked: profile.is_blocked || false,
        } : null,
        brand_id: membership?.entity_type === 'brand' ? membership.entity_id : null,
      });
      setLoading(false);
    };

    fetchUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
