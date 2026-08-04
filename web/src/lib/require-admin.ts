import "server-only";

import type { User } from "@supabase/supabase-js";
import { requireUser } from "./auth-request";
import { adminSupabase } from "./supabase-admin";

/**
 * Route-handler admin gate. Returns the authenticated admin user, or a
 * pre-formed Response (401 or 403) that the handler should return as-is.
 *
 *   const r = await requireAdmin();
 *   if (r instanceof Response) return r;
 *   const user = r;
 */
export async function requireAdmin(): Promise<User | Response> {
  const u = await requireUser();
  if (u instanceof Response) return u;

  const { data } = await adminSupabase()
    .from("profiles")
    .select("role")
    .eq("id", u.id)
    .maybeSingle();

  if (!data || data.role !== "admin") {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return u;
}
