import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  var browserSupabaseClient: SupabaseClient | undefined;
}

export const supabase =
  globalThis.browserSupabaseClient ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.browserSupabaseClient = supabase;
}
