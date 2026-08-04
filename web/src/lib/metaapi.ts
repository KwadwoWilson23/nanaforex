import "server-only";

// ============================================================
// MetaAPI wrapper (fetch-based, no SDK bloat).
// All calls are stateless. Investor passwords are forwarded once
// to MetaAPI at provisioning time and never persisted on our side.
// ============================================================

const PROVISIONING =
  "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
// The old client-API hub URL (mt-client-api-v1.agiliumtrade.agiliumtrade.ai)
// now serves an invalid TLS cert (DEPTH_ZERO_SELF_SIGNED_CERT). MetaAPI now
// requires the region-specific endpoint: mt-client-api-v1.<region>.agiliumtrade.ai
// So we resolve the account's region via provisioning first, then hit that.
function clientHostForRegion(region: string): string {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}

// Short-lived in-memory cache of accountId → region so we don't refetch
// the account on every call within the same warm serverless invocation.
const regionCache = new Map<string, string>();

async function accountRegion(accountId: string): Promise<string> {
  const cached = regionCache.get(accountId);
  if (cached) return cached;
  const acc = await req<{ region?: string }>(
    "GET",
    PROVISIONING,
    `/users/current/accounts/${accountId}`,
  );
  const r = acc.region;
  if (!r) throw new Error(`MetaAPI account ${accountId} has no region assigned`);
  regionCache.set(accountId, r);
  return r;
}

async function clientHost(accountId: string): Promise<string> {
  return clientHostForRegion(await accountRegion(accountId));
}

function token(): string {
  const t = process.env.METAAPI_TOKEN;
  if (!t)
    throw new Error(
      "METAAPI_TOKEN env var missing (set in Vercel → Project → Settings → Environment Variables)",
    );
  return t;
}

type ApiError = Error & { status?: number; body?: unknown };

async function req<T>(
  method: string,
  host: string,
  path: string,
  body?: unknown,
): Promise<T> {
  // Enforce an explicit fetch timeout — Node's default is effectively
  // infinite and MetaAPI occasionally holds connections open forever.
  const ac = new AbortController();
  const timeoutMs = 20_000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(host + path, {
      method,
      headers: {
        "auth-token": token(),
        accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: ac.signal,
    });
  } catch (rawErr) {
    // Unwrap undici's opaque "fetch failed" — real reason lives on
    // err.cause (DNS, TLS, ECONNRESET, abort, etc.). Surface it so
    // "fetch failed" never appears alone.
    const cause = (rawErr as { cause?: { code?: string; message?: string; name?: string } })?.cause;
    const parts: string[] = [];
    if (rawErr instanceof Error) parts.push(rawErr.name === "AbortError" ? `timeout after ${timeoutMs}ms` : rawErr.message);
    if (cause?.code) parts.push(`code=${cause.code}`);
    if (cause?.message && cause.message !== (rawErr as Error).message) parts.push(cause.message);
    if (cause?.name && cause.name !== "Error") parts.push(`kind=${cause.name}`);
    const detail = parts.join(" · ") || "unknown network error";
    throw new Error(`MetaAPI ${method} ${host}${path} → ${detail}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const dObj = (data ?? {}) as { message?: string; details?: string };
    const msg = dObj.message || dObj.details || text || res.statusText;
    const err: ApiError = new Error(`MetaAPI ${method} ${path} → ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// -------- types --------
export type MtPlatform = "mt4" | "mt5";

export type AccountInfo = {
  balance: number;
  equity: number;
  currency?: string;
  [k: string]: unknown;
};

export type Position = {
  id: string | number;
  symbol: string;
  type: string; // POSITION_TYPE_BUY | POSITION_TYPE_SELL
  volume: number;
  openPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  time?: string | number | Date;
  profit?: number;
  commission?: number;
  swap?: number;
  [k: string]: unknown;
};

export type Deal = {
  id?: string | number;
  positionId?: string | number;
  entryType?: string;
  time?: string | number | Date;
  price?: number;
  profit?: number;
  [k: string]: unknown;
};

// -------- provisioning --------
export async function provisionAccount(input: {
  platform: MtPlatform;
  login: string | number;
  password: string;
  server: string;
  name?: string;
}): Promise<{ accountId: string }> {
  const acc = await req<{ id: string }>(
    "POST",
    PROVISIONING,
    "/users/current/accounts",
    {
      name: input.name || `Nana Forex ${input.login}`,
      type: "cloud-g1",
      login: String(input.login),
      password: input.password,
      server: input.server,
      platform: input.platform,
      magic: 0,
      application: "MetaApi",
    },
  );
  await req<void>(
    "POST",
    PROVISIONING,
    `/users/current/accounts/${acc.id}/deploy`,
    {},
  );
  return { accountId: acc.id };
}

export async function unlinkAccount(accountId: string): Promise<void> {
  try {
    await req(
      "POST",
      PROVISIONING,
      `/users/current/accounts/${accountId}/undeploy`,
      {},
    );
  } catch (e) {
    const err = e as ApiError;
    if (err.status !== 404) throw e;
  }
  try {
    await req("DELETE", PROVISIONING, `/users/current/accounts/${accountId}`);
  } catch (e) {
    const err = e as ApiError;
    if (err.status !== 404) throw e;
  }
}

// -------- reads (route to the account's region-specific client API) --------
export async function getAccountInfo(accountId: string): Promise<AccountInfo> {
  const host = await clientHost(accountId);
  return req<AccountInfo>(
    "GET",
    host,
    `/users/current/accounts/${accountId}/account-information`,
  );
}

export async function getPositions(accountId: string): Promise<Position[]> {
  const host = await clientHost(accountId);
  return req<Position[]>(
    "GET",
    host,
    `/users/current/accounts/${accountId}/positions`,
  );
}

export async function getDealsByTimeRange(
  accountId: string,
  sinceIso: string,
  untilIso: string,
): Promise<Deal[]> {
  const host = await clientHost(accountId);
  return req<Deal[]>(
    "GET",
    host,
    `/users/current/accounts/${accountId}/history-deals/time/${encodeURIComponent(
      sinceIso,
    )}/${encodeURIComponent(untilIso)}`,
  );
}
