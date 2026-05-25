import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

type AdminClient = SupabaseClient;

// Singleton — reuse the same client across module invocations in serverless
const globalForSupabase = globalThis as unknown as {
  _supabaseAdmin?: AdminClient;
};

export function supabaseAdmin(): AdminClient {
  if (!globalForSupabase._supabaseAdmin) {
    globalForSupabase._supabaseAdmin = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return globalForSupabase._supabaseAdmin;
}
