import "server-only";

import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createSupabaseServer } from "./supabase-server";
import { adminSupabase } from "./supabase-admin";

/**
 * Route-handler auth helper. Tries an Authorization: Bearer token
 * first (useful for immediate-after-sign-in fetches where the SSR
 * cookie hasn't propagated yet), then falls back to the cookie
 * session set by @supabase/ssr.
 */
export async function getUser(): Promise<User | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (token) {
      try {
        const { data, error } = await adminSupabase().auth.getUser(token);
        if (!error && data?.user) return data.user;
      } catch {
        /* fall through to cookie session */
      }
    }
  }
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Convenience: return user or a 401 Response.
 * Usage in a route handler:
 *   const r = await requireUser();
 *   if (r instanceof Response) return r;
 *   const user = r;
 */
export async function requireUser(): Promise<User | Response> {
  const user = await getUser();
  if (!user)
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  return user;
}
