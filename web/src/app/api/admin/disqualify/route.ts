import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";
import * as metaapi from "@/lib/metaapi";

export const runtime = "nodejs";
export const maxDuration = 30;

type Body = { participant_id?: string; reason?: string };

export async function POST(req: Request) {
  const rl = enforce(req, { name: "admin-dq", limit: 20, windowMs: 60_000 });
  if (rl) return rl;

  const gate = await requireAdmin();
  if (gate instanceof Response) return gate;
  const user = gate;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { participant_id, reason } = body;
  if (!participant_id) {
    return NextResponse.json({ error: "participant_id required" }, { status: 400 });
  }

  const sb = adminSupabase();
  const { data: p, error: perr } = await sb
    .from("participants")
    .select("id, competition_id, tracking_ref, tracking_provider, status, mt_login")
    .eq("id", participant_id)
    .single();
  if (perr || !p) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }
  if (p.status === "disqualified") {
    return NextResponse.json({ ok: true, alreadyDisqualified: true });
  }

  if (p.tracking_provider === "metaapi" && p.tracking_ref) {
    try {
      await metaapi.unlinkAccount(p.tracking_ref);
    } catch (e) {
      console.warn("[admin/disqualify] unlink failed", { participant: p.id, err: e });
    }
  }

  const { data: updated, error: uerr } = await sb
    .from("participants")
    .update({
      status: "disqualified",
      status_reason: reason || "Disqualified by admin",
      disqualified_at: new Date().toISOString(),
      disqualified_by: user.id,
      tracking_ref: null,
      tracking_meta: {},
    })
    .eq("id", p.id)
    .select("id, status, status_reason, disqualified_at")
    .single();
  if (uerr) {
    console.error("[admin/disqualify] update failed", { participant: p.id, err: uerr });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "admin_disqualify",
    entity_type: "participant",
    entity_id: p.id,
    metadata: {
      competition_id: p.competition_id,
      reason: reason || null,
      mt_login: p.mt_login,
    },
  });

  return NextResponse.json({ participant: updated });
}
