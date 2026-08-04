import "server-only";

// ============================================================
// MetaAPI wrapper (fetch-based, no SDK bloat).
// All calls are stateless. Investor passwords are forwarded once
// to MetaAPI at provisioning time and never persisted on our side.
// ============================================================

const PROVISIONING =
  "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const CLIENT = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";

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
  const res = await fetch(host + path, {
    method,
    headers: {
      "auth-token": token(),
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    // never cache MetaAPI calls in Next's data cache
    cache: "no-store",
  });
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

// -------- reads --------
export function getAccountInfo(accountId: string) {
  return req<AccountInfo>(
    "GET",
    CLIENT,
    `/users/current/accounts/${accountId}/account-information`,
  );
}

export function getPositions(accountId: string) {
  return req<Position[]>(
    "GET",
    CLIENT,
    `/users/current/accounts/${accountId}/positions`,
  );
}

export function getDealsByTimeRange(
  accountId: string,
  sinceIso: string,
  untilIso: string,
) {
  return req<Deal[]>(
    "GET",
    CLIENT,
    `/users/current/accounts/${accountId}/history-deals/time/${encodeURIComponent(
      sinceIso,
    )}/${encodeURIComponent(untilIso)}`,
  );
}
