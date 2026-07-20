// ============================================================
// POST /api/competitions/connect
//
// Body: {
//   participant_id: uuid,
//   login: string|number,   // MT account number
//   server: string,         // broker server name
//   platform: 'mt4' | 'mt5',
//   password: string,       // INVESTOR (read-only) password
//   broker?: string
// }
// Auth: Authorization: Bearer <supabase_access_token>
//
// Provisions the account with MetaAPI, records the accountId, and
// pulls the starting balance. The investor password is forwarded to
// MetaAPI once and immediately dropped — never persisted on our side.
// ============================================================

const { admin } = require("../_lib/supabase");
const { requireUser } = require("../_lib/auth");
const { enforce } = require("../_lib/ratelimit");
const metaapi = require("../_lib/metaapi");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  // Very tight rate limit — provisioning burns money.
  if (!enforce(req, res, { name: "connect", limit: 3, windowMs: 60_000 })) return;

  const user = await requireUser(req, res);
  if (!user) return;

  const {
    participant_id,
    login,
    server,
    platform,
    password,
    broker,
  } = req.body || {};

  if (!participant_id || !login || !server || !platform || !password) {
    return res.status(400).json({
      error: "participant_id, login, server, platform and password are required",
    });
  }
  if (!["mt4", "mt5"].includes(platform)) {
    return res.status(400).json({ error: "platform must be 'mt4' or 'mt5'" });
  }

  const sb = admin();

  // Verify the participant belongs to this user
  const { data: p, error: perr } = await sb
    .from("participants")
    .select("id, user_id, competition_id, status, tracking_ref")
    .eq("id", participant_id)
    .single();
  if (perr || !p) return res.status(404).json({ error: "Participant not found" });
  if (p.user_id !== user.id) return res.status(403).json({ error: "Not your participation" });
  if (p.status === "disqualified" || p.status === "withdrawn") {
    return res.status(409).json({ error: `Participation is ${p.status}` });
  }
  if (p.tracking_ref) {
    return res.status(409).json({ error: "Account already connected" });
  }

  // Fetch the competition to check platform is allowed
  const { data: comp } = await sb
    .from("competitions")
    .select("id, name, rules, status, end_date")
    .eq("id", p.competition_id)
    .single();
  const allowed = (comp?.rules?.allowed_platforms) || ["mt4", "mt5"];
  if (!allowed.includes(platform)) {
    return res
      .status(400)
      .json({ error: `This competition allows: ${allowed.join(", ")}` });
  }
  if (comp?.status === "ended" || new Date(comp.end_date) < new Date()) {
    return res.status(409).json({ error: "Competition has ended" });
  }

  // Optimistic status update
  await sb
    .from("participants")
    .update({ status: "connecting", mt_platform: platform, mt_login: String(login), mt_server: server, broker_name: broker || null })
    .eq("id", p.id);

  let accountId;
  try {
    const provisioned = await metaapi.provisionAccount({
      platform,
      login,
      password,   // dropped immediately — MetaAPI stores it
      server,
      name: `Nana Forex ${user.email || user.id.slice(0, 8)} ${login}`,
    });
    accountId = provisioned.accountId;
  } catch (e) {
    // Roll status back so user can retry
    await sb.from("participants").update({ status: "pending", status_reason: e.message }).eq("id", p.id);
    return res.status(502).json({ error: "Could not connect to broker via MetaAPI: " + e.message });
  }

  // Fetch balance/equity for starting_balance (best-effort; may fail if MetaAPI is still deploying)
  let startingBalance = null;
  try {
    const info = await metaapi.getAccountInfo(accountId);
    startingBalance = info.balance;
  } catch (e) {
    // Not fatal — sync worker will populate on next tick.
    console.warn("[connect] getAccountInfo failed:", e.message);
  }

  const patch = {
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
    .select("id, status, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity")
    .single();

  if (uerr) return res.status(500).json({ error: uerr.message });

  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "competition:connect",
    entity_type: "participant",
    entity_id: p.id,
    metadata: { competition_id: p.competition_id, platform, login: String(login), server },
  });

  return res.status(200).json({ participant: updated });
};
