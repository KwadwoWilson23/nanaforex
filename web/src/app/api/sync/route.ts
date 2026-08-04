import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase-admin";
import * as metaapi from "@/lib/metaapi";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

// ---------------------------------------------------------------
// /api/sync — cron target
// Called by cron-job.org every minute with:
//   Authorization: Bearer <CRON_SECRET>
// For each active competition, syncs every connected participant:
//   - balance/equity, positions, closed deals
//   - drawdown check (auto-DQ + unlink on breach)
//   - snapshots to leaderboard_snapshots
// ---------------------------------------------------------------

type Comp = {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  rules: Record<string, unknown> | null;
};

type Participant = {
  id: string;
  user_id: string;
  tracking_ref: string;
  tracking_provider: string;
  tracking_meta?: Record<string, unknown> | null;
  starting_balance: number | null;
  peak_equity: number | null;
  last_sync_at: string | null;
  status: string;
};

type Stats = {
  competitionsScanned: number;
  competitionsActivated: number;
  competitionsEnded: number;
  participantsSynced: number;
  autoDisqualified: number;
  accountsUnlinked: number;
  snapshotsWritten: number;
  tradesTouched: number;
  errors: Array<{ scope: string; [k: string]: unknown }>;
  durationMs?: number;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[sync] CRON_SECRET env var not set");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const stats: Stats = {
    competitionsScanned: 0,
    competitionsActivated: 0,
    competitionsEnded: 0,
    participantsSynced: 0,
    autoDisqualified: 0,
    accountsUnlinked: 0,
    snapshotsWritten: 0,
    tradesTouched: 0,
    errors: [],
  };

  const sb = adminSupabase();
  const now = new Date();

  try {
    const { data: comps, error: cerr } = await sb
      .from("competitions")
      .select("id, name, status, start_date, end_date, rules")
      .in("status", ["upcoming", "active"]);
    if (cerr) throw cerr;
    const list = (comps || []) as Comp[];
    stats.competitionsScanned = list.length;

    for (const c of list) {
      if (c.status === "upcoming" && new Date(c.start_date) <= now) {
        const { error } = await sb
          .from("competitions")
          .update({ status: "active" })
          .eq("id", c.id);
        if (!error) {
          c.status = "active";
          stats.competitionsActivated++;
        }
      }
    }

    const liveComps = list.filter(
      (c) =>
        c.status === "active" &&
        new Date(c.start_date) <= now &&
        new Date(c.end_date) >= now,
    );

    for (const comp of liveComps) {
      const { data: participants, error: perr } = await sb
        .from("participants")
        .select(
          "id, user_id, tracking_ref, tracking_provider, tracking_meta, starting_balance, peak_equity, last_sync_at, status",
        )
        .eq("competition_id", comp.id)
        .eq("tracking_provider", "metaapi")
        .in("status", ["connected", "connecting"])
        .not("tracking_ref", "is", null);
      if (perr) {
        stats.errors.push({ scope: "load-participants", competition: comp.id, error: perr.message });
        continue;
      }

      const results = await Promise.allSettled(
        ((participants || []) as Participant[]).map((p) =>
          syncParticipant(sb, comp, p, stats),
        ),
      );
      for (const r of results) {
        if (r.status === "rejected") {
          stats.errors.push({ scope: "sync-participant", error: String(r.reason) });
        }
      }
    }

    // End competitions whose end_date is past.
    const endedComps = list.filter(
      (c) => c.status === "active" && new Date(c.end_date) < now,
    );
    for (const comp of endedComps) {
      await sb.from("competitions").update({ status: "ended" }).eq("id", comp.id);
      stats.competitionsEnded++;

      const { data: aps } = await sb
        .from("participants")
        .select("id, tracking_ref, tracking_provider, tracking_meta, status")
        .eq("competition_id", comp.id)
        .eq("tracking_provider", "metaapi")
        .not("tracking_ref", "is", null);

      for (const p of (aps || []) as (Participant & { tracking_meta?: Record<string, unknown> | null })[]) {
        try {
          await metaapi.unlinkAccount(p.tracking_ref);
          stats.accountsUnlinked++;
        } catch (e) {
          stats.errors.push({ scope: "unlink-on-end", participant: p.id, error: String(e) });
        }
        const finalStatus =
          p.status === "disqualified" || p.status === "withdrawn"
            ? p.status
            : "completed";
        await sb
          .from("participants")
          .update({
            status: finalStatus,
            tracking_ref: null,
            tracking_meta: {
              ...(p.tracking_meta || {}),
              ended_at: new Date().toISOString(),
            },
          })
          .eq("id", p.id);
      }
    }

    stats.durationMs = Date.now() - startedAt;
    const errorCount = stats.errors.length;
    if (errorCount) console.warn("[sync] completed with errors", stats.errors);
    return NextResponse.json({
      ok: true,
      errorCount,
      competitionsScanned: stats.competitionsScanned,
      competitionsActivated: stats.competitionsActivated,
      competitionsEnded: stats.competitionsEnded,
      participantsSynced: stats.participantsSynced,
      autoDisqualified: stats.autoDisqualified,
      accountsUnlinked: stats.accountsUnlinked,
      snapshotsWritten: stats.snapshotsWritten,
      tradesTouched: stats.tradesTouched,
      durationMs: stats.durationMs,
    });
  } catch (e) {
    console.error("[sync] top-level failure", e);
    stats.durationMs = Date.now() - startedAt;
    return NextResponse.json(
      { ok: false, durationMs: stats.durationMs, errorCount: stats.errors.length + 1 },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------
// Sync one participant
// ---------------------------------------------------------------
async function syncParticipant(
  sb: SupabaseClient,
  comp: Comp,
  p: Participant,
  stats: Stats,
) {
  const accountId = p.tracking_ref;
  const rules = (comp.rules || {}) as { max_drawdown_pct?: number };
  const maxDrawdown =
    typeof rules.max_drawdown_pct === "number" ? rules.max_drawdown_pct : null;

  let info: { balance?: number; equity?: number };
  try {
    info = await metaapi.getAccountInfo(accountId);
  } catch (e) {
    stats.errors.push({ scope: "get-account-info", participant: p.id, error: String(e) });
    return;
  }

  const balance = num(info.balance);
  const equity = num(info.equity);
  const startingBalance = num(p.starting_balance) || balance;
  const peakEquity = Math.max(num(p.peak_equity) || startingBalance, equity);
  const drawdownPct =
    peakEquity > 0 ? Math.max(0, ((peakEquity - equity) / peakEquity) * 100) : 0;
  const profitPct =
    startingBalance > 0 ? ((equity - startingBalance) / startingBalance) * 100 : 0;

  let openPositions: Array<Record<string, unknown>> = [];
  try {
    openPositions = (await metaapi.getPositions(accountId)) as Array<Record<string, unknown>>;
  } catch (e) {
    stats.errors.push({ scope: "get-positions", participant: p.id, error: String(e) });
  }

  const openIdsFromMt = new Set(openPositions.map((pos) => String(pos.id)));
  const upserts = openPositions.map((pos) => ({
    participant_id: p.id,
    mt_ticket_id: String(pos.id),
    symbol: String(pos.symbol || ""),
    side: /BUY/i.test(String(pos.type)) ? "buy" : "sell",
    lot_size: num(pos.volume),
    open_price: num(pos.openPrice),
    open_time: pos.time ? new Date(pos.time as string).toISOString() : new Date().toISOString(),
    stop_loss: pos.stopLoss != null ? num(pos.stopLoss) : null,
    take_profit: pos.takeProfit != null ? num(pos.takeProfit) : null,
    commission: num(pos.commission || 0),
    swap: num(pos.swap || 0),
    profit: num(pos.profit || 0),
    status: "open",
    synced_at: new Date().toISOString(),
  }));

  if (upserts.length) {
    const { error, count } = await sb
      .from("trades")
      .upsert(upserts, { onConflict: "participant_id,mt_ticket_id", count: "exact" });
    if (error) {
      stats.errors.push({ scope: "upsert-open", participant: p.id, error: error.message });
    } else {
      stats.tradesTouched += count || upserts.length;
    }
  }

  const { data: openInDb } = await sb
    .from("trades")
    .select("id, mt_ticket_id")
    .eq("participant_id", p.id)
    .eq("status", "open");

  const toClose = (openInDb || []).filter(
    (t: { mt_ticket_id: string }) => !openIdsFromMt.has(t.mt_ticket_id),
  );

  if (toClose.length) {
    const sinceIso = p.last_sync_at || comp.start_date;
    const untilIso = new Date().toISOString();
    let deals: Array<Record<string, unknown>> = [];
    try {
      deals = (await metaapi.getDealsByTimeRange(
        accountId,
        sinceIso,
        untilIso,
      )) as Array<Record<string, unknown>>;
    } catch (e) {
      stats.errors.push({ scope: "get-deals", participant: p.id, error: String(e) });
    }
    const closeByPos = new Map<string, Record<string, unknown>>();
    for (const d of deals) {
      if (d && d.entryType === "DEAL_ENTRY_OUT" && d.positionId != null) {
        closeByPos.set(String(d.positionId), d);
      }
    }
    for (const t of toClose as Array<{ id: string; mt_ticket_id: string }>) {
      const d = closeByPos.get(t.mt_ticket_id);
      const patch: Record<string, unknown> = {
        status: "closed",
        close_time: d?.time
          ? new Date(d.time as string).toISOString()
          : new Date().toISOString(),
      };
      if (d) {
        if (d.price != null) patch.close_price = num(d.price);
        if (d.profit != null) patch.profit = num(d.profit);
      }
      await sb.from("trades").update(patch).eq("id", t.id);
      stats.tradesTouched++;
    }
  }

  const { count: tradeCount } = await sb
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", p.id);

  let newStatus = p.status === "connecting" ? "connected" : p.status;
  let statusReason: string | null = null;
  let disqualifiedAt: string | null = null;
  let unlinkAfterUpdate = false;

  if (maxDrawdown != null && drawdownPct > maxDrawdown) {
    newStatus = "disqualified";
    statusReason = `Drawdown ${drawdownPct.toFixed(2)}% exceeded max ${maxDrawdown}%`;
    disqualifiedAt = new Date().toISOString();
    unlinkAfterUpdate = true;
    stats.autoDisqualified++;
  }

  const patch: Record<string, unknown> = {
    current_balance: balance,
    current_equity: equity,
    peak_equity: peakEquity,
    max_drawdown_pct: Number(drawdownPct.toFixed(2)),
    trade_count: tradeCount || 0,
    last_sync_at: new Date().toISOString(),
    status: newStatus,
  };
  if (!p.starting_balance) patch.starting_balance = startingBalance;
  if (statusReason) patch.status_reason = statusReason;
  if (disqualifiedAt) patch.disqualified_at = disqualifiedAt;

  await sb.from("participants").update(patch).eq("id", p.id);
  stats.participantsSynced++;

  const { error: sErr } = await sb.from("leaderboard_snapshots").insert({
    competition_id: comp.id,
    participant_id: p.id,
    rank: 0,
    equity,
    profit_pct: Number(profitPct.toFixed(2)),
    drawdown_pct: Number(drawdownPct.toFixed(2)),
    trade_count: tradeCount || 0,
  });
  if (!sErr) stats.snapshotsWritten++;

  if (unlinkAfterUpdate) {
    try {
      await metaapi.unlinkAccount(accountId);
      stats.accountsUnlinked++;
      await sb.from("participants").update({ tracking_ref: null }).eq("id", p.id);
    } catch (e) {
      stats.errors.push({ scope: "unlink-on-dq", participant: p.id, error: String(e) });
    }
    await sb.from("audit_log").insert({
      actor_id: null,
      action: "auto_disqualify",
      entity_type: "participant",
      entity_id: p.id,
      metadata: {
        reason: statusReason,
        competition_id: comp.id,
        drawdown_pct: Number(drawdownPct.toFixed(2)),
        max_drawdown_pct: maxDrawdown,
      },
    });
  }
}
