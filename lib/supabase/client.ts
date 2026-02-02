import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for use in Client Components
 * Automatically manages auth state
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
