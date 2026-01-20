type Entry<T> = { value: T; expiresAt: number };
const cache = new Map<string, Entry<any>>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>) {
  const now = Date.now();
  const cur = cache.get(key);
  if (cur && cur.expiresAt > now) return cur.value as T;

  const value = await fn();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}