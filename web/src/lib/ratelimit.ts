import "server-only";

// ============================================================
// Rate limiter — in-memory sliding window, per (name × client-ip).
// Good enough for MVP. Each serverless instance keeps its own
// bucket, so effective limit ≈ N × configured rate under load.
// ============================================================

const buckets = new Map<string, number[]>();

function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Enforce a limit. On breach, returns a Response(429). Otherwise returns null.
 * Use in route handlers as:
 *   const rl = enforce(req, { name: "join", limit: 8, windowMs: 60_000 });
 *   if (rl) return rl;
 */
export function enforce(
  req: Request,
  { name, limit, windowMs }: { name: string; limit: number; windowMs: number },
): Response | null {
  const key = `${name}:${clientKey(req)}`;
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  buckets.set(key, arr);
  if (arr.length > limit) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Slow down." }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(Math.ceil(windowMs / 1000)),
        },
      },
    );
  }
  return null;
}
