// ============================================================
// POST /api/admin/disqualify
//
// Body: { participant_id: uuid, reason?: string }
// Auth: Authorization: Bearer <supabase_access_token>
//       + the user must have profiles.role = 'admin'
//
// Marks the participant disqualified, unlinks the MetaAPI account
// (STOPS BILLING immediately), and writes an audit_log row.
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
  if (!enforce(req, res, { name: "admin-dq", limit: 20, windowMs: 60_000 })) return;

  const user = await requireUser(req, res);
  if (!user) return;

  const sb = admin();

  // Gate: profiles.role = 'admin'
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { participant_id, reason } = req.body || {};
  if (!participant_id) {
    return res.status(400).json({ error: "participant_id required" });
  }

  const { data: p, error } = await sb
    .from("participants")
    .select(
      "id, competition_id, tracking_ref, tracking_provider, status, mt_login"
    )
    .eq("id", participant_id)
    .single();
  if (error || !p) return res.status(404).json({ error: "Participant not found" });

  if (p.status === "disqualified") {
    return res.status(200).json({ ok: true, alreadyDisqualified: true });
  }

  // Unlink MetaAPI first — stops billing regardless of what happens next.
  if (p.tracking_provider === "metaapi" && p.tracking_ref) {
    try {
      await metaapi.unlinkAccount(p.tracking_ref);
    } catch (e) {
      // Non-fatal; log it in the audit trail below.
      console.warn("[admin/disqualify] unlink failed:", e.message);
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

  if (uerr) return res.status(500).json({ error: uerr.message });

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

  return res.status(200).json({ participant: updated });
};
