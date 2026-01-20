type Bucket = { count: number; resetAt: number };

const mem = new Map<string, Bucket>();

export function rateLimit(key: string, windowSec: number, max: number) {
  const now = Date.now();
  const resetAt = now + windowSec * 1000;

  const b = mem.get(key);
  if (!b || b.resetAt < now) {
    mem.set(key, { count: 1, resetAt });
    return { ok: true, remaining: max - 1 };
  }

  if (b.count >= max) {
    return { ok: false, remaining: 0, retryAfterMs: b.resetAt - now };
  }

  b.count += 1;
  mem.set(key, b);
  return { ok: true, remaining: max - b.count };
}