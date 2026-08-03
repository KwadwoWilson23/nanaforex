import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

let _client: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the SERVICE ROLE key (bypasses RLS).
 * Only imported inside route handlers, never bundled into the browser.
 * Requires SUPABASE_SERVICE_ROLE_KEY set in Vercel env vars.
 */
export function adminSupabase(): SupabaseClient {
  if (_client) return _client;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY env var missing (add it in Vercel → Project → Settings → Environment Variables; it's the service_role key from Supabase → Settings → API)",
    );
  }
  _client = createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application": "nanaforex-web" } },
  });
  return _client;
}
