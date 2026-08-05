import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/resend";
import { welcomeEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";

// ---------------------------------------------------------------
// POST /api/emails/welcome
// Sends the welcome email to the currently signed-in user, once.
// Idempotent — checks profiles.preferences.welcome_sent and no-ops
// on repeat calls. Called client-side after email/password signup
// and after first Google Sign-In.
// ---------------------------------------------------------------

export async function POST(req: Request) {
  const rl = enforce(req, { name: "email-welcome", limit: 5, windowMs: 60_000 });
  if (rl) return rl;

  const userOrRes = await requireUser();
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  if (!user.email) return NextResponse.json({ ok: true, skipped: "no_email" });

  const sb = adminSupabase();
  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
  if (prefs.welcome_sent_at) {
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  const name =
    profile?.full_name ||
    (user.user_metadata as { full_name?: string; name?: string } | undefined)
      ?.full_name ||
    (user.user_metadata as { name?: string } | undefined)?.name ||
    user.email.split("@")[0] ||
    "Trader";

  const origin = req.headers.get("origin") || "https://nanaforex.com";
  const { subject, html, text } = welcomeEmail({
    name,
    dashboardUrl: `${origin}/users/client-dashboard`,
  });

  const result = await sendEmail({ to: user.email, subject, html, text });

  if (result.ok) {
    await sb
      .from("profiles")
      .update({
        preferences: { ...prefs, welcome_sent_at: new Date().toISOString() },
      })
      .eq("id", user.id);
  }
  // Always report success to the client — email delivery failure is not
  // an auth failure. The server-side log captures the real outcome.
  return NextResponse.json({ ok: true, sent: result.ok });
}
