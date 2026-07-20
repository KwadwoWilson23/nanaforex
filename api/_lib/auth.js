// ============================================================
// Auth helper — extract the logged-in Supabase user from a request.
//
// The browser calls our /api/* endpoints with:
//   Authorization: Bearer <supabase_access_token>
// which it gets from supabaseClient.auth.getSession().access_token.
// Server verifies the token via the service role client, so we're
// authoritatively identifying the user (not trusting the client).
// ============================================================

const { admin } = require("./supabase");

async function getUserFromRequest(req) {
  const raw = req.headers.authorization || req.headers.Authorization;
  if (!raw || !raw.startsWith("Bearer ")) return null;
  const token = raw.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    const { data, error } = await admin().auth.getUser(token);
    if (error || !data || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

// Convenience wrapper: writes 401 + returns null if unauthenticated.
async function requireUser(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return user;
}

module.exports = { getUserFromRequest, requireUser };
