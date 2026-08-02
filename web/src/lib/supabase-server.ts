import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Per-request server client. Reads/writes auth cookies through
// Next's cookies() so RSCs + server actions share the same session.
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Read-only in Server Components (which is fine — middleware handles
          // the refresh flow). Swallow silently.
        }
      },
    },
  });
}
