import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

/**
 * OAuth (or magic-link / password-recovery) callback.
 * Supabase redirects here with `?code=<auth-code>`.
 * We exchange the code for a session (which writes cookies via SSR helpers)
 * and then bounce the user to their intended destination.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/users/client-dashboard";
  const type = url.searchParams.get("type"); // 'recovery' | 'signup' | ...

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/users/login?error=${encodeURIComponent(error.message)}`,
          request.url,
        ),
      );
    }
  }

  // Password recovery links go straight to the update-password form.
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/update-password", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
