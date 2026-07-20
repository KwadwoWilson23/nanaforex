// ============================================================
// Server-side Supabase admin client
//
// Uses the service_role key (env var SUPABASE_SERVICE_ROLE_KEY),
// which BYPASSES Row Level Security. Only imported inside
// serverless functions — never bundled into the browser.
// ============================================================

const { createClient } = require("@supabase/supabase-js");

let _client = null;

function admin() {
  if (_client) return _client;

  const url =
    process.env.SUPABASE_URL ||
    "https://xjmakedoqdbfafhbhjsj.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY env var missing (add it in Vercel → Project → Settings → Environment Variables; it's the service_role key from Supabase → Settings → API)"
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application": "nanaforex-server" } },
  });
  return _client;
}

module.exports = { admin };
