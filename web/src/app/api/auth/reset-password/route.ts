import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/resend";
import { passwordResetEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";

// ---------------------------------------------------------------
// POST /api/auth/reset-password
// Body: { email: string }
//
// Generates a Supabase recovery link server-side via admin API,
// then delivers it through Resend so we don't rely on Supabase's
// default email template. Always returns 200 to prevent enumeration —
// callers can't tell whether the email exists.
// ---------------------------------------------------------------

export async function POST(req: Request) {
  const rl = enforce(req, { name: "auth-reset", limit: 5, windowMs: 60_000 });
  if (rl) return rl;

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true });
  }

  const sb = adminSupabase();
  const origin = req.headers.get("origin") || "https://nanaforex.com";

  try {
    const { data, error } = await sb.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/update-password` },
    });
    const link = data?.properties?.action_link;
    if (error || !link) {
      // Don't leak whether the email exists — log server-side, silent success.
      console.warn("[auth/reset] generateLink failed", { email, err: error });
      return NextResponse.json({ ok: true });
    }

    const { subject, html, text } = passwordResetEmail({ link });
    await sendEmail({ to: email, subject, html, text });
  } catch (e) {
    console.error("[auth/reset] threw", { email, err: e });
  }

  return NextResponse.json({ ok: true });
}
