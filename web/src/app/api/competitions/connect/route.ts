import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";
import * as metaapi from "@/lib/metaapi";

export const runtime = "nodejs";
export const maxDuration = 45;

type Body = {
  participant_id?: string;
  login?: string | number;
  server?: string;
  platform?: "mt4" | "mt5";
  password?: string;
  broker?: string | null;
};

export async function POST(req: Request) {
  const rl = enforce(req, { name: "connect", limit: 3, windowMs: 60_000 });
  if (rl) return rl;

  const userOrRes = await requireUser();
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { participant_id, login, server, platform, password, broker } = body;

  if (!participant_id || !login || !server || !platform || !password) {
    return NextResponse.json(
      {
        error:
          "participant_id, login, server, platform and password are required",
      },
      { status: 400 },
    );
  }
  if (platform !== "mt4" && platform !== "mt5") {
    return NextResponse.json(
      { error: "platform must be 'mt4' or 'mt5'" },
      { status: 400 },
    );
  }

  const sb = adminSupabase();

  const { data: p, error: perr } = await sb
    .from("participants")
    .select("id, user_id, competition_id, status, tracking_ref")
    .eq("id", participant_id)
    .single();
  if (perr || !p)
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  if (p.user_id !== user.id)
    return NextResponse.json({ error: "Not your participation" }, { status: 403 });
  if (p.status === "disqualified" || p.status === "withdrawn") {
    return NextResponse.json(
      { error: `Participation is ${p.status}` },
      { status: 409 },
    );
  }
  if (p.tracking_ref) {
    return NextResponse.json({ error: "Account already connected" }, { status: 409 });
  }

  const { data: comp } = await sb
    .from("competitions")
    .select("id, rules, status, end_date")
    .eq("id", p.competition_id)
    .single();
  const rules = (comp?.rules ?? {}) as { allowed_platforms?: string[] };
  const allowed = rules.allowed_platforms || ["mt4", "mt5"];
  if (!allowed.includes(platform)) {
    return NextResponse.json(
      { error: `This competition allows: ${allowed.join(", ")}` },
      { status: 400 },
    );
  }
  if (!comp || comp.status === "ended" || new Date(comp.end_date) < new Date()) {
    return NextResponse.json({ error: "Competition has ended" }, { status: 409 });
  }

  await sb
    .from("participants")
    .update({
      status: "connecting",
      mt_platform: platform,
      mt_login: String(login),
      mt_server: server,
      broker_name: broker || null,
    })
    .eq("id", p.id);

  // Admin detection (admins see raw MetaAPI error text so they can debug)
  let isAdmin = false;
  {
    const { data: profile } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  let accountId: string;
  try {
    const provisioned = await metaapi.provisionAccount({
      platform,
      login,
      password, // dropped after this call
      server,
      name: `Nana Forex ${user.email || user.id.slice(0, 8)} ${login}`,
    });
    accountId = provisioned.accountId;
  } catch (e) {
    console.error("[connect] provisionAccount failed", { participant: p.id, err: e });
    const raw = e instanceof Error ? e.message : String(e);
    await sb
      .from("participants")
      .update({
        status: "pending",
        status_reason: "We couldn't connect to your broker. Check your server name, MT login, and investor password, then try again.",
      })
      .eq("id", p.id);
    return NextResponse.json(
      isAdmin
        ? {
            error:
              "We couldn't connect to your broker. Please double-check the server name, MT login, and investor (read-only) password, then try again.",
            debug: raw,
          }
        : {
            error:
              "We couldn't connect to your broker. Please double-check the server name, MT login, and investor (read-only) password, then try again.",
          },
      { status: 502 },
    );
  }

  let startingBalance: number | null = null;
  try {
    const info = await metaapi.getAccountInfo(accountId);
    startingBalance = info.balance;
  } catch {
    // sync worker will backfill on next tick
  }

  const patch: Record<string, unknown> = {
    tracking_provider: "metaapi",
    tracking_ref: accountId,
    tracking_meta: { provisioned_at: new Date().toISOString() },
    status: "connected",
    status_reason: null,
    connected_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
  };
  if (startingBalance != null) {
    patch.starting_balance = startingBalance;
    patch.current_balance = startingBalance;
    patch.current_equity = startingBalance;
    patch.peak_equity = startingBalance;
  }

  const { data: updated, error: uerr } = await sb
    .from("participants")
    .update(patch)
    .eq("id", p.id)
    .select(
      "id, status, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity",
    )
    .single();
  if (uerr) {
    console.error("[connect] participant update failed", { participant: p.id, err: uerr });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "competition:connect",
    entity_type: "participant",
    entity_id: p.id,
    metadata: {
      competition_id: p.competition_id,
      platform,
      login: String(login),
      server,
    },
  });

  return NextResponse.json({ participant: updated });
}
