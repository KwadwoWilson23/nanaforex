import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { adminSupabase } from "@/lib/supabase-admin";
import { enforce } from "@/lib/ratelimit";
import * as metaapi from "@/lib/metaapi";

export const runtime = "nodejs";
export const maxDuration = 30;

// -----------------------------------------------------------
// POST /api/competitions/refresh
// Body: { participant_id: uuid }
// Auth: signed-in user must own the participant (or be an admin)
//
// Forces a single-participant sync outside the cron cycle. Called
// when the user clicks "Refresh live data" so they don't have to wait
// up to a minute for the next cron tick.
// -----------------------------------------------------------

export async function POST(req: Request) {
  const rl = enforce(req, { name: "refresh", limit: 15, windowMs: 60_000 });
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
  if (!participant_id) {
    return NextResponse.json({ error: "participant_id required" }, { status: 400 });
  }

  const sb = adminSupabase();
  const { data: p, error: perr } = await sb
    .from("participants")
    .select(
      "id, user_id, competition_id, tracking_ref, tracking_provider, status, starting_balance, peak_equity",
    )
    .eq("id", participant_id)
    .single();
  if (perr || !p) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  // Owner check (admin fallback)
  if (p.user_id !== user.id) {
    const { data: profile } = await sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Not your participation" }, { status: 403 });
    }
  }

  if (p.tracking_provider !== "metaapi" || !p.tracking_ref) {
    return NextResponse.json(
      { error: "This account isn't linked yet — connect it first." },
      { status: 409 },
    );
  }

  try {
    const info = await metaapi.getAccountInfo(p.tracking_ref);
    const balance = Number(info.balance) || 0;
    const equity = Number(info.equity) || 0;
    const starting = Number(p.starting_balance) || balance;
    const peak = Math.max(Number(p.peak_equity) || starting, equity);
    const dd = peak > 0 ? Math.max(0, ((peak - equity) / peak) * 100) : 0;

    // Pull open positions + upsert trades so trade_count reflects reality.
    let positionsCount = 0;
    try {
      const positions = (await metaapi.getPositions(p.tracking_ref)) as Array<
        Record<string, unknown>
      >;
      positionsCount = positions.length;
      if (positions.length) {
        const upserts = positions.map((pos) => ({
          participant_id: p.id,
          mt_ticket_id: String(pos.id),
          symbol: String(pos.symbol || ""),
          side: /BUY/i.test(String(pos.type)) ? "buy" : "sell",
          lot_size: Number(pos.volume) || 0,
          open_price: Number(pos.openPrice) || 0,
          open_time: pos.time
            ? new Date(pos.time as string).toISOString()
            : new Date().toISOString(),
          stop_loss: pos.stopLoss != null ? Number(pos.stopLoss) : null,
          take_profit: pos.takeProfit != null ? Number(pos.takeProfit) : null,
          commission: Number(pos.commission || 0),
          swap: Number(pos.swap || 0),
          profit: Number(pos.profit || 0),
          status: "open",
          synced_at: new Date().toISOString(),
        }));
        await sb
          .from("trades")
          .upsert(upserts, { onConflict: "participant_id,mt_ticket_id" });
      }
    } catch (posErr) {
      console.warn("[refresh] getPositions failed (equity still updated)", {
        participant: p.id,
        err: posErr,
      });
    }

    // Recount trades (open + closed already in table)
    const { count: tradeCount } = await sb
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("participant_id", p.id);

    const patch: Record<string, unknown> = {
      current_balance: balance,
      current_equity: equity,
      peak_equity: peak,
      max_drawdown_pct: Number(dd.toFixed(2)),
      trade_count: tradeCount ?? positionsCount,
      last_sync_at: new Date().toISOString(),
    };
    if (!p.starting_balance) patch.starting_balance = starting;
    if (p.status === "connecting") patch.status = "connected";

    const { data: updated } = await sb
      .from("participants")
      .update(patch)
      .eq("id", p.id)
      .select(
        "id, status, starting_balance, current_balance, current_equity, max_drawdown_pct, trade_count, last_sync_at",
      )
      .single();

    return NextResponse.json({ participant: updated });
  } catch (e) {
    console.error("[refresh] getAccountInfo failed", { participant: p.id, err: e });
    const msg = e instanceof Error ? e.message : String(e);
    // Translate common MetaAPI failures into human copy without leaking internals.
    const friendly =
      /404|not found/i.test(msg)
        ? "This account isn't registered with the broker link anymore. Withdraw and reconnect."
        : /401|403|forbidden|unauthorized|invalid password/i.test(msg)
          ? "Broker refused the investor password. Double-check it and reconnect."
          : /deploying|not deployed|not connected/i.test(msg)
            ? "Your account is still setting up with the broker link. Give it about a minute and try again."
            : "Couldn't reach the broker right now. Try again in a moment.";
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
