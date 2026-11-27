import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/cache/redisCache";

interface RateBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, RateBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Fixed-window rate limiter using Redis when connected, or an in-memory Map fallback.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
      }
      const ttl = await redis.ttl(redisKey);
      return {
        allowed: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetInSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    } catch {
      // Fallback to in-memory
    }
  }

  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || now > existing.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxRequests - 1, resetInSeconds: windowSeconds };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= maxRequests,
    remaining: Math.max(0, maxRequests - existing.count),
    resetInSeconds,
  };
}

/**
 * Extract client IP from request headers and apply rate limiting.
 * Returns null if allowed, or a 429 NextResponse if limit exceeded.
 */
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  maxRequests = 20,
  windowSeconds = 60
): Promise<NextResponse | null> {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const result = await checkRateLimit(`${scope}:${ip}`, maxRequests, windowSeconds);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetInSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
