// ============================================================
// /api/health — end-to-end connectivity check
//
// GETs both Supabase (as service role) and MetaAPI (list accounts).
// Returns 200 when both work, 503 with details when either fails.
// Use this after adding env vars to confirm everything is wired.
// ============================================================

const { admin } = require("./_lib/supabase");
const metaapi = require("./_lib/metaapi");

module.exports = async function handler(req, res) {
  const started = Date.now();
  const result = {
    ok: false,
    timestamp: new Date().toISOString(),
    checks: {
      supabase: { ok: false },
      metaapi: { ok: false },
    },
  };

  // ---- Supabase check ----
  try {
    const { count, error } = await admin()
      .from("competitions")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    result.checks.supabase = {
      ok: true,
      competitionCount: count ?? 0,
    };
  } catch (e) {
    result.checks.supabase = { ok: false, error: e.message };
  }

  // ---- MetaAPI check ----
  try {
    const accounts = await metaapi.listAccounts();
    result.checks.metaapi = {
      ok: true,
      accountCount: Array.isArray(accounts) ? accounts.length : 0,
    };
  } catch (e) {
    result.checks.metaapi = { ok: false, error: e.message };
  }

  result.ok = result.checks.supabase.ok && result.checks.metaapi.ok;
  result.durationMs = Date.now() - started;

  res.setHeader("cache-control", "no-store");
  res.status(result.ok ? 200 : 503).json(result);
};
