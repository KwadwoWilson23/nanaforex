// ============================================================
// MetaAPI wrapper — provider-agnostic surface for the sync worker
//
// We use raw REST (native fetch, Node 20+) rather than the metaapi.cloud
// SDK to avoid pulling ~30MB of transitive dependencies into the
// serverless bundle. All calls are stateless. Investor passwords are
// forwarded once to MetaAPI at provisioning time and never persisted
// on our side.
// ============================================================

const PROVISIONING = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const CLIENT       = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";

function token() {
  const t = process.env.METAAPI_TOKEN;
  if (!t) throw new Error("METAAPI_TOKEN env var missing (set in Vercel → Project → Settings → Environment Variables)");
  return t;
}

async function req(method, host, path, body) {
  const res = await fetch(host + path, {
    method,
    headers: {
      "auth-token": token(),
      "accept": "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = data?.message || data?.details || text || res.statusText;
    const err = new Error(`MetaAPI ${method} ${path} → ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// ---------- Provisioning (account lifecycle) ----------

async function listAccounts() {
  return req("GET", PROVISIONING, "/users/current/accounts");
}

async function provisionAccount({ platform, login, password, server, name }) {
  const body = {
    name: name || `Nana Forex ${login}`,
    type: "cloud",
    login: String(login),
    password,                 // investor password — MetaAPI stores it, we never do
    server,
    platform,                 // 'mt4' | 'mt5'
    magic: 0,
    application: "MetaApi",
    connectionStatus: "CONNECTED",
  };
  const acc = await req("POST", PROVISIONING, "/users/current/accounts", body);
  await req("POST", PROVISIONING, `/users/current/accounts/${acc.id}/deploy`, {});
  return { accountId: acc.id };
}

async function unlinkAccount(accountId) {
  try { await req("POST", PROVISIONING, `/users/current/accounts/${accountId}/undeploy`, {}); }
  catch (e) { if (e.status !== 404) throw e; }
  try { await req("DELETE", PROVISIONING, `/users/current/accounts/${accountId}`); }
  catch (e) { if (e.status !== 404) throw e; }
}

// ---------- Reading account state (called from cron) ----------

async function getAccountInfo(accountId) {
  return req("GET", CLIENT, `/users/current/accounts/${accountId}/account-information`);
}

async function getPositions(accountId) {
  return req("GET", CLIENT, `/users/current/accounts/${accountId}/positions`);
}

// Closed deals in a time range; used to write to the trades table.
async function getDealsByTimeRange(accountId, sinceIso, untilIso) {
  const from = encodeURIComponent(sinceIso);
  const to   = encodeURIComponent(untilIso);
  return req(
    "GET",
    CLIENT,
    `/users/current/accounts/${accountId}/history-deals/time/${from}/${to}`
  );
}

module.exports = {
  listAccounts,
  provisionAccount,
  unlinkAccount,
  getAccountInfo,
  getPositions,
  getDealsByTimeRange,
};
