const cache = new Map();
const CACHE_TTL = 300000;

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setCached(key, value, ttl = CACHE_TTL) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

export function clearCache() {
  cache.clear();
}
