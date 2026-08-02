"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

// Singleton browser client. Called by client components + client actions.
let _client: SupabaseClient | null = null;

export function createSupabaseBrowser(): SupabaseClient {
  if (_client) return _client;
  _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}
