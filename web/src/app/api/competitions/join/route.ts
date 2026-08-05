import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/resend";
import { competitionJoinedEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rl = enforce(req, { name: "join", limit: 8, windowMs: 60_000 });
  if (rl) return rl;

  const userOrRes = await requireUser();
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  let body: { slug?: string; competition_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { slug, competition_id } = body;
  if (!slug && !competition_id) {
    return NextResponse.json(
      { error: "slug or competition_id required" },
      { status: 400 },
    );
  }

  const sb = adminSupabase();

  const query = sb
    .from("competitions")
    .select("id, name, slug, status, end_date, prize_pool")
    .limit(1);
  const { data: comps, error: qerr } = slug
    ? await query.eq("slug", slug)
    : await query.eq("id", competition_id);
  if (qerr) {
    console.error("[join] lookup failed", { err: qerr });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  const comp = comps?.[0];
  if (!comp)
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });

  if (comp.status === "ended" || comp.status === "cancelled") {
    return NextResponse.json(
      { error: `Competition is ${comp.status}` },
      { status: 409 },
    );
  }
  if (new Date(comp.end_date) < new Date()) {
    return NextResponse.json(
      { error: "Competition has ended" },
      { status: 409 },
    );
  }

  const { data: existing } = await sb
    .from("participants")
    .select("id, status")
    .eq("competition_id", comp.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Allow rejoin after a self-withdrawal: reset the row so the connect
    // form re-appears. Disqualified stays disqualified — admin has to
    // reinstate manually.
    if (existing.status === "withdrawn") {
      const { data: reset, error: rerr } = await sb
        .from("participants")
        .update({
          status: "pending",
          status_reason: null,
          tracking_ref: null,
          tracking_provider: null,
          tracking_meta: {},
          starting_balance: null,
          current_balance: null,
          current_equity: null,
          peak_equity: null,
          max_drawdown_pct: null,
          trade_count: 0,
          last_sync_at: null,
          connected_at: null,
          mt_platform: null,
          mt_login: null,
          mt_server: null,
          broker_name: null,
        })
        .eq("id", existing.id)
        .select("id, status")
        .single();
      if (rerr) {
        console.error("[join] rejoin reset failed", { participant: existing.id, err: rerr });
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
      }
      await sb.from("audit_log").insert({
        actor_id: user.id,
        action: "competition:rejoin",
        entity_type: "participant",
        entity_id: existing.id,
        metadata: { competition_id: comp.id, competition_name: comp.name },
      });
      return NextResponse.json({ participant: reset, rejoined: true });
    }
    return NextResponse.json({ participant: existing, alreadyJoined: true });
  }

  const { data: inserted, error: ierr } = await sb
    .from("participants")
    .insert({
      competition_id: comp.id,
      user_id: user.id,
      status: "pending",
    })
    .select("id, status")
    .single();
  if (ierr) {
    console.error("[join] insert failed", { user: user.id, competition: comp.id, err: ierr });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "competition:join",
    entity_type: "participant",
    entity_id: inserted.id,
    metadata: { competition_id: comp.id, competition_name: comp.name },
  });

  // Fire-and-forget competition-joined email. Failures logged but never
  // block the join response — an email hiccup shouldn't fail the join.
  if (user.email) {
    const { data: profile } = await sb
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const name =
      profile?.full_name ||
      (user.user_metadata as { full_name?: string } | undefined)?.full_name ||
      user.email.split("@")[0] ||
      "Trader";
    const origin = req.headers.get("origin") || "https://nanaforex.com";
    const { subject, html, text } = competitionJoinedEmail({
      name,
      competitionName: comp.name,
      competitionUrl: `${origin}/users/competitions/${comp.slug}`,
      prizePool: comp.prize_pool,
    });
    // Not awaited so the response returns fast even if Resend is slow.
    sendEmail({ to: user.email, subject, html, text }).catch((e) =>
      console.error("[join] competition email failed", { user: user.id, err: e }),
    );
  }

  return NextResponse.json(
    { participant: inserted, alreadyJoined: false },
    { status: 201 },
  );
}
