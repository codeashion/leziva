import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClientInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase Admin Client using the secret service key.
 * This client bypasses Row Level Security (RLS) and can perform administrative tasks
 * such as creating Auth users, modifying system tables, and managing buckets.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ugmkhukrfmvnhyoqynkr.supabase.co";

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    "sb_secret_sfht-LFy9Y2G13v93M4MXw_s7S8PLue";

  adminClientInstance = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}

export const supabaseAdmin = getSupabaseAdmin();
