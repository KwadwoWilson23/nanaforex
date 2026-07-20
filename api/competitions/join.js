// ============================================================
// POST /api/competitions/join
//
// Body: { slug: string } or { competition_id: uuid }
// Auth: Authorization: Bearer <supabase_access_token>
//
// Inserts a participants row with status='pending'. The user then
// completes /api/competitions/connect to link their MT5 account.
// ============================================================

const { admin } = require("../_lib/supabase");
const { requireUser } = require("../_lib/auth");
const { enforce } = require("../_lib/ratelimit");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!enforce(req, res, { name: "join", limit: 8, windowMs: 60_000 })) return;

  const user = await requireUser(req, res);
  if (!user) return;

  const { slug, competition_id } = req.body || {};
  if (!slug && !competition_id) {
    return res.status(400).json({ error: "slug or competition_id required" });
  }

  const sb = admin();

  // Look up the competition
  const query = sb.from("competitions").select("id, name, status, end_date, rules").limit(1);
  const { data: comps, error: qerr } = slug
    ? await query.eq("slug", slug)
    : await query.eq("id", competition_id);
  if (qerr) return res.status(500).json({ error: qerr.message });
  const comp = comps && comps[0];
  if (!comp) return res.status(404).json({ error: "Competition not found" });

  if (comp.status === "ended" || comp.status === "cancelled") {
    return res.status(409).json({ error: `Competition is ${comp.status}` });
  }
  if (new Date(comp.end_date) < new Date()) {
    return res.status(409).json({ error: "Competition has ended" });
  }

  // Insert participants row (unique constraint prevents double-join)
  const { data: existing } = await sb
    .from("participants")
    .select("id, status")
    .eq("competition_id", comp.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Idempotent — return the existing row.
    return res.status(200).json({ participant: existing, alreadyJoined: true });
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

  if (ierr) return res.status(500).json({ error: ierr.message });

  // Audit
  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "competition:join",
    entity_type: "participant",
    entity_id: inserted.id,
    metadata: { competition_id: comp.id, competition_name: comp.name },
  });

  return res.status(201).json({ participant: inserted, alreadyJoined: false });
};
