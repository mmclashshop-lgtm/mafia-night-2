interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  default: { windowMs: 1000, maxRequests: 10 },
  'chat:message': { windowMs: 2000, maxRequests: 5 },
  'chat:mafia': { windowMs: 2000, maxRequests: 5 },
  'action:night': { windowMs: 3000, maxRequests: 3 },
  'action:vote': { windowMs: 2000, maxRequests: 3 },
  'room:create': { windowMs: 10000, maxRequests: 2 },
  'room:join': { windowMs: 5000, maxRequests: 5 },
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(event: string): Map<string, RateLimitEntry> {
  if (!stores.has(event)) {
    stores.set(event, new Map());
  }
  return stores.get(event)!;
}

export function checkRateLimit(socketId: string, event: string): boolean {
  const config: RateLimitConfig = (DEFAULTS[event] ?? DEFAULTS['default']) ?? { windowMs: 1000, maxRequests: 10 };
  const store = getStore(event);
  const now = Date.now();

  const entry = store.get(socketId);
  if (!entry || now >= entry.resetAt) {
    store.set(socketId, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function resetRateLimit(socketId: string): void {
  for (const store of stores.values()) {
    store.delete(socketId);
  }
}
