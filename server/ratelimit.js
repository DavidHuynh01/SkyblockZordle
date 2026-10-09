// In-memory per-IP rate limiting. Lives in the Lambda container, and since the
// account allows at most 10 concurrent containers, a flood is spread over very
// few buckets — good enough to stop a naive hammer without a paid WAF.
const WINDOW_MS = 60_000;
const MAX_TRACKED = 5000; // bound memory; evict wholesale if exceeded

// Writes are the expensive path (they hit DynamoDB), so they get a tighter cap.
export const LIMITS = { write: 30, read: 120 };

export function createRateLimiter({ now = () => Date.now(), limits = LIMITS } = {}) {
  const buckets = new Map();

  return {
    // Returns { allowed, retryAfter } — never throws.
    check(ip, kind = "read") {
      if (!ip) return { allowed: true };
      const max = limits[kind] ?? limits.read;
      const t = now();
      const key = `${kind}|${ip}`;

      if (buckets.size > MAX_TRACKED) buckets.clear();

      const b = buckets.get(key);
      if (!b || t >= b.resetAt) {
        buckets.set(key, { count: 1, resetAt: t + WINDOW_MS });
        return { allowed: true };
      }
      b.count += 1;
      if (b.count > max) {
        return { allowed: false, retryAfter: Math.ceil((b.resetAt - t) / 1000) };
      }
      return { allowed: true };
    },

    size: () => buckets.size,
  };
}
