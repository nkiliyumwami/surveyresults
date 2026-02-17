import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Auth features will not work.");
  // Create a dummy client that won't crash but won't work either
  // This allows the main dashboard to still render
  supabase = createClient("https://placeholder.supabase.co", "placeholder-key");
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
