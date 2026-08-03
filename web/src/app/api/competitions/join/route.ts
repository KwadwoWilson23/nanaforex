import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";

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
    .select("id, name, status, end_date")
    .limit(1);
  const { data: comps, error: qerr } = slug
    ? await query.eq("slug", slug)
    : await query.eq("id", competition_id);
  if (qerr) return NextResponse.json({ error: qerr.message }, { status: 500 });
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
  if (ierr) return NextResponse.json({ error: ierr.message }, { status: 500 });

  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "competition:join",
    entity_type: "participant",
    entity_id: inserted.id,
    metadata: { competition_id: comp.id, competition_name: comp.name },
  });

  return NextResponse.json(
    { participant: inserted, alreadyJoined: false },
    { status: 201 },
  );
}
