import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";
import * as metaapi from "@/lib/metaapi";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const rl = enforce(req, { name: "withdraw", limit: 5, windowMs: 60_000 });
  if (rl) return rl;

  const userOrRes = await requireUser();
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  let body: { participant_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { participant_id } = body;
  if (!participant_id)
    return NextResponse.json({ error: "participant_id required" }, { status: 400 });

  const sb = adminSupabase();
  const { data: p, error } = await sb
    .from("participants")
    .select("id, user_id, competition_id, status, tracking_provider, tracking_ref")
    .eq("id", participant_id)
    .single();
  if (error || !p)
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  if (p.user_id !== user.id)
    return NextResponse.json({ error: "Not your participation" }, { status: 403 });
  if (
    p.status === "withdrawn" ||
    p.status === "completed" ||
    p.status === "disqualified"
  ) {
    return NextResponse.json({ participant: p, alreadyWithdrawn: true });
  }

  if (p.tracking_provider === "metaapi" && p.tracking_ref) {
    try {
      await metaapi.unlinkAccount(p.tracking_ref);
    } catch {
      // non-fatal
    }
  }

  const { data: updated, error: uerr } = await sb
    .from("participants")
    .update({
      status: "withdrawn",
      status_reason: "withdrawn by user",
      tracking_ref: null,
      tracking_meta: {},
    })
    .eq("id", p.id)
    .select("id, status")
    .single();
  if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 });

  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "competition:withdraw",
    entity_type: "participant",
    entity_id: p.id,
    metadata: { competition_id: p.competition_id },
  });

  return NextResponse.json({ participant: updated });
}
