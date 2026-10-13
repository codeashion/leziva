import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates and returns a Supabase client for client-side components.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ugmkhukrfmvnhyoqynkr.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Amj5j50trIUN8ujXfGg8Hw_nhAIzN82";

  return createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabaseBrowser = createClient();
