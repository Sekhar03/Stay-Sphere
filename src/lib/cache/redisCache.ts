import Redis from "ioredis";

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();
let redisClient: Redis | null = null;
let redisAttempted = false;

function getRedis(): Redis | null {
  if (redisAttempted) return redisClient;
  redisAttempted = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: (times) => (times > 1 ? null : 250),
    });
    redisClient.on("error", () => {
      // Fall back silently to memory store
    });
  } catch {
    redisClient = null;
  }
  return redisClient;
}

/**
 * Retrieve a JSON-serialized value from Redis (if available) or the local in-memory cache.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Fall through to memory store
    }
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return null;
  }
}

/**
 * Store a JSON-serializable value in Redis (with TTL) and the local in-memory cache.
 */
export async function setCached(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const serialized = JSON.stringify(value);
  memoryStore.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  // Bound memory store size to prevent unbounded growth
  if (memoryStore.size > 200) {
    const firstKey = memoryStore.keys().next().value;
    if (firstKey) memoryStore.delete(firstKey);
  }

  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      await redis.set(key, serialized, "EX", ttlSeconds);
    } catch {
      // Ignore Redis write error
    }
  }
}

/**
 * Invalidate all cached keys matching a prefix (e.g. "properties:").
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  for (const key of Array.from(memoryStore.keys())) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }

  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Ignore Redis delete error
    }
  }
}

export { getRedis };
