// ============================================================
// Rate limiter — in-memory sliding window, per key.
//
// Good enough for MVP. Each serverless instance keeps its own
// bucket, so effective limit ≈ N × configured rate under load.
// Upgrade to Upstash/Redis if abuse becomes real.
// ============================================================

const buckets = new Map();

function clientKey(req) {
  const xff = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xff || req.headers["x-real-ip"] || "unknown";
}

// Returns { ok: boolean, remaining: number, resetIn: ms }.
function hit(key, { limit, windowMs }) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  buckets.set(key, arr);
  const ok = arr.length <= limit;
  return { ok, remaining: Math.max(0, limit - arr.length), resetIn: windowMs };
}

// Convenience: enforce a limit; if exceeded, writes 429 and returns false.
function enforce(req, res, { name, limit, windowMs }) {
  const key = `${name}:${clientKey(req)}`;
  const { ok, remaining, resetIn } = hit(key, { limit, windowMs });
  res.setHeader("x-ratelimit-remaining", String(remaining));
  if (!ok) {
    res.setHeader("retry-after", String(Math.ceil(resetIn / 1000)));
    res.status(429).json({ error: "Too many requests. Slow down." });
    return false;
  }
  return true;
}

module.exports = { enforce, hit, clientKey };
