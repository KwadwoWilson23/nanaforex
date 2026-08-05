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
// Called client-side after email/password signup and after
// Google Sign-In.
//
// Idempotency: tracks welcome_sent_at inside auth.users.user_metadata
// (not profiles.preferences) so the trigger race between auth.users
// insert and the handle_new_user trigger can't cause duplicate sends.
// ---------------------------------------------------------------

export async function POST(req: Request) {
  const rl = enforce(req, { name: "email-welcome", limit: 5, windowMs: 60_000 });
  if (rl) return rl;

  const userOrRes = await requireUser();
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  if (!user.email) return NextResponse.json({ ok: true, skipped: "no_email" });

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.welcome_sent_at) {
    return NextResponse.json({ ok: true, alreadySent: true });
  }

  const name =
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    user.email.split("@")[0] ||
    "Trader";

  const origin = req.headers.get("origin") || "https://nanaforex.com";
  const { subject, html, text } = welcomeEmail({
    name,
    dashboardUrl: `${origin}/users/client-dashboard`,
  });

  const result = await sendEmail({ to: user.email, subject, html, text });

  if (result.ok) {
    // Store the flag on the auth user (bypasses profiles trigger race).
    try {
      await adminSupabase().auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          welcome_sent_at: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn("[email/welcome] flag update failed", { user: user.id, err: e });
    }
  }
  return NextResponse.json({ ok: true, sent: result.ok });
}
