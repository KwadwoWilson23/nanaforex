// ============================================================
// /api/sync — the cron target
//
// For each active competition, for each connected participant:
//   1. Pull balance/equity from MetaAPI
//   2. Pull open positions + recent closed deals; upsert to `trades`
//   3. Update participant balance/equity/drawdown/last_sync_at
//   4. If drawdown exceeds the competition's max → auto-DQ + unlink
//      the MetaAPI account (stops billing immediately)
//   5. Write a row to `leaderboard_snapshots`
//
// Also:
//   * Transitions competitions upcoming → active when start_date passes
//   * Transitions competitions active → ended when end_date passes;
//     unlinks every remaining MetaAPI account so we stop paying
//
// Auth: Bearer CRON_SECRET (env var). Vercel Cron auto-attaches this.
// If you're on Vercel Hobby (daily cron only), point cron-job.org at
//   POST https://nanaforex.com/api/sync
//   Header: Authorization: Bearer <CRON_SECRET>
// every 1 minute.
// ============================================================

const { admin } = require("./_lib/supabase");
const metaapi = require("./_lib/metaapi");

module.exports = async function handler(req, res) {
  // ---- Auth ----
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  if (!secret) {
    return res.status(500).json({ error: "CRON_SECRET env var not set" });
  }
  if (auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const startedAt = Date.now();
  const stats = {
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

  const sb = admin();
  const now = new Date();

  try {
    // ---- 1. Load competitions we care about ----
    const { data: comps, error: cerr } = await sb
      .from("competitions")
      .select("id, name, status, start_date, end_date, rules")
      .in("status", ["upcoming", "active"]);
    if (cerr) throw cerr;
    stats.competitionsScanned = (comps || []).length;

    // Auto-transition upcoming → active
    for (const c of comps || []) {
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

    // ---- 2. Sync every connected participant in currently-live comps ----
    const liveComps = (comps || []).filter(
      (c) =>
        c.status === "active" &&
        new Date(c.start_date) <= now &&
        new Date(c.end_date) >= now
    );

    for (const comp of liveComps) {
      const { data: participants, error: perr } = await sb
        .from("participants")
        .select(
          "id, user_id, tracking_ref, tracking_provider, starting_balance, peak_equity, last_sync_at, status"
        )
        .eq("competition_id", comp.id)
        .eq("tracking_provider", "metaapi")
        .in("status", ["connected", "connecting"])
        .not("tracking_ref", "is", null);
      if (perr) {
        stats.errors.push({ scope: "load-participants", competition: comp.id, error: perr.message });
        continue;
      }

      // Sync all participants for this competition in parallel.
      const results = await Promise.allSettled(
        (participants || []).map((p) => syncParticipant(sb, comp, p, stats))
      );
      for (const r of results) {
        if (r.status === "rejected") {
          stats.errors.push({ scope: "sync-participant", error: String(r.reason?.message || r.reason) });
        }
      }
    }

    // ---- 3. Close out ended competitions ----
    const endedComps = (comps || []).filter(
      (c) => c.status === "active" && new Date(c.end_date) < now
    );
    for (const comp of endedComps) {
      await sb.from("competitions").update({ status: "ended" }).eq("id", comp.id);
      stats.competitionsEnded++;

      // Unlink every remaining MetaAPI account (STOPS BILLING).
      const { data: aps } = await sb
        .from("participants")
        .select("id, tracking_ref, tracking_provider, status")
        .eq("competition_id", comp.id)
        .eq("tracking_provider", "metaapi")
        .not("tracking_ref", "is", null);

      for (const p of aps || []) {
        try {
          await metaapi.unlinkAccount(p.tracking_ref);
          stats.accountsUnlinked++;
        } catch (e) {
          stats.errors.push({ scope: "unlink-on-end", participant: p.id, error: e.message });
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
            tracking_meta: { ...(p.tracking_meta || {}), ended_at: new Date().toISOString() },
          })
          .eq("id", p.id);
      }
    }

    stats.durationMs = Date.now() - startedAt;
    return res.status(200).json({ ok: true, ...stats });
  } catch (e) {
    stats.durationMs = Date.now() - startedAt;
    return res.status(500).json({ ok: false, error: e.message, ...stats });
  }
};

// ------------------------------------------------------------
// Sync one participant
// ------------------------------------------------------------
async function syncParticipant(sb, comp, p, stats) {
  const accountId = p.tracking_ref;
  const rules = comp.rules || {};
  const maxDrawdown =
    typeof rules.max_drawdown_pct === "number" ? rules.max_drawdown_pct : null;

  // ---- Live balance/equity ----
  let info;
  try {
    info = await metaapi.getAccountInfo(accountId);
  } catch (e) {
    stats.errors.push({ scope: "get-account-info", participant: p.id, error: e.message });
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

  // ---- Open positions → upsert to trades ----
  let openPositions = [];
  try {
    openPositions = await metaapi.getPositions(accountId);
  } catch (e) {
    stats.errors.push({ scope: "get-positions", participant: p.id, error: e.message });
  }

  const openIdsFromMt = new Set(openPositions.map((pos) => String(pos.id)));
  const upserts = openPositions.map((pos) => ({
    participant_id: p.id,
    mt_ticket_id: String(pos.id),
    symbol: String(pos.symbol || ""),
    side: /BUY/i.test(String(pos.type)) ? "buy" : "sell",
    lot_size: num(pos.volume),
    open_price: num(pos.openPrice),
    open_time: pos.time ? new Date(pos.time).toISOString() : new Date().toISOString(),
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

  // ---- Mark trades that were open in our DB but no longer open in MT ----
  const { data: openInDb } = await sb
    .from("trades")
    .select("id, mt_ticket_id")
    .eq("participant_id", p.id)
    .eq("status", "open");

  const toClose = (openInDb || []).filter(
    (t) => !openIdsFromMt.has(t.mt_ticket_id)
  );

  // Enrich closed trades with actual close price + profit from history-deals.
  if (toClose.length) {
    const sinceIso = p.last_sync_at || comp.start_date;
    const untilIso = new Date().toISOString();
    let deals = [];
    try {
      deals = await metaapi.getDealsByTimeRange(accountId, sinceIso, untilIso);
    } catch (e) {
      stats.errors.push({ scope: "get-deals", participant: p.id, error: e.message });
    }
    // Index closing deals by positionId
    const closeByPos = new Map();
    for (const d of deals) {
      if (d && d.entryType === "DEAL_ENTRY_OUT" && d.positionId != null) {
        closeByPos.set(String(d.positionId), d);
      }
    }
    for (const t of toClose) {
      const d = closeByPos.get(t.mt_ticket_id);
      const patch = {
        status: "closed",
        close_time: d?.time ? new Date(d.time).toISOString() : new Date().toISOString(),
      };
      if (d) {
        if (d.price != null) patch.close_price = num(d.price);
        if (d.profit != null) patch.profit = num(d.profit);
      }
      await sb.from("trades").update(patch).eq("id", t.id);
      stats.tradesTouched++;
    }
  }

  // ---- Recompute trade_count from trades table ----
  const { count: tradeCount } = await sb
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("participant_id", p.id);

  // ---- Rule checks (auto-DQ) ----
  let newStatus = p.status === "connecting" ? "connected" : p.status;
  let statusReason = null;
  let disqualifiedAt = null;
  let unlinkAfterUpdate = false;

  if (maxDrawdown != null && drawdownPct > maxDrawdown) {
    newStatus = "disqualified";
    statusReason = `Drawdown ${drawdownPct.toFixed(2)}% exceeded max ${maxDrawdown}%`;
    disqualifiedAt = new Date().toISOString();
    unlinkAfterUpdate = true;
    stats.autoDisqualified++;
  }

  const patch = {
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

  // ---- Snapshot for the historical chart ----
  const { error: sErr } = await sb.from("leaderboard_snapshots").insert({
    competition_id: comp.id,
    participant_id: p.id,
    rank: 0, // computed live via the leaderboard_current view
    equity,
    profit_pct: Number(profitPct.toFixed(2)),
    drawdown_pct: Number(drawdownPct.toFixed(2)),
    trade_count: tradeCount || 0,
  });
  if (!sErr) stats.snapshotsWritten++;

  // ---- If DQ'd, unlink and audit ----
  if (unlinkAfterUpdate) {
    try {
      await metaapi.unlinkAccount(accountId);
      stats.accountsUnlinked++;
      await sb
        .from("participants")
        .update({ tracking_ref: null })
        .eq("id", p.id);
    } catch (e) {
      stats.errors.push({ scope: "unlink-on-dq", participant: p.id, error: e.message });
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

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
