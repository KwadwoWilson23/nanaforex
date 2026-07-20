// ============================================================
// POST /api/competitions/withdraw
//
// Body: { participant_id: uuid }
// Auth: Authorization: Bearer <supabase_access_token>
//
// User withdraws from a competition. If they had a connected MetaAPI
// account, we unlink it there too (stops billing).
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
  if (!enforce(req, res, { name: "withdraw", limit: 5, windowMs: 60_000 })) return;

  const user = await requireUser(req, res);
  if (!user) return;

  const { participant_id } = req.body || {};
  if (!participant_id) return res.status(400).json({ error: "participant_id required" });

  const sb = admin();

  const { data: p, error } = await sb
    .from("participants")
    .select("id, user_id, competition_id, status, tracking_provider, tracking_ref")
    .eq("id", participant_id)
    .single();
  if (error || !p) return res.status(404).json({ error: "Participant not found" });
  if (p.user_id !== user.id) return res.status(403).json({ error: "Not your participation" });
  if (p.status === "withdrawn" || p.status === "completed" || p.status === "disqualified") {
    return res.status(200).json({ participant: p, alreadyWithdrawn: true });
  }

  // Unlink MetaAPI first (stops billing). Non-fatal on failure.
  if (p.tracking_provider === "metaapi" && p.tracking_ref) {
    try {
      await metaapi.unlinkAccount(p.tracking_ref);
    } catch (e) {
      console.warn("[withdraw] unlink failed:", e.message);
    }
  }

  const { data: updated, error: uerr } = await sb
    .from("participants")
    .update({
      status: "withdrawn",
      status_reason: "withdrawn by user",
      tracking_ref: null,        // free the MetaAPI slot
      tracking_meta: {},
    })
    .eq("id", p.id)
    .select("id, status")
    .single();

  if (uerr) return res.status(500).json({ error: uerr.message });

  await sb.from("audit_log").insert({
    actor_id: user.id,
    action: "competition:withdraw",
    entity_type: "participant",
    entity_id: p.id,
    metadata: { competition_id: p.competition_id },
  });

  return res.status(200).json({ participant: updated });
};
