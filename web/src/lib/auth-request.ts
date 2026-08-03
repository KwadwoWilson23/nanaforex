import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServer } from "./supabase-server";

/**
 * Route-handler auth helper. Reads the SSR cookie session and returns
 * the authenticated user, or null.
 */
export async function getUser(): Promise<User | null> {
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
