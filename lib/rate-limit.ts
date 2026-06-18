import "server-only";

import { getRedis } from "@/lib/redis";

type RateLimitPolicy = {
  limit: number;
  windowMs: number;
  name: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | {
      ok: true;
      limit: number;
      remaining: number;
      resetAt: number;
    }
  | {
      ok: false;
      limit: number;
      remaining: 0;
      resetAt: number;
      retryAfter: number;
    };

const buckets = new Map<string, Bucket>();
let lastPrune = 0;

export const rateLimitPolicies = {
  analyze: { name: "analyze", limit: 12, windowMs: 60_000 },
  health: { name: "health", limit: 20, windowMs: 60_000 },
  market: { name: "market", limit: 60, windowMs: 60_000 }
} satisfies Record<string, RateLimitPolicy>;

export async function checkRateLimit(request: Request, policy: RateLimitPolicy): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `${policy.name}:${clientKey(request)}`;
  const shared = await checkSharedRateLimit(key, policy, now);
  if (shared) return shared;

  return checkMemoryRateLimit(key, policy, now);
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfter) })
  };
}

async function checkSharedRateLimit(
  key: string,
  policy: RateLimitPolicy,
  now: number
): Promise<RateLimitResult | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const redisKey = `markettwin:ratelimit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, Math.max(1, Math.ceil(policy.windowMs / 1000)));

    const ttl = await redis.ttl(redisKey);
    const resetAt = now + Math.max(1, ttl) * 1000;

    if (count > policy.limit) {
      return {
        ok: false,
        limit: policy.limit,
        remaining: 0,
        resetAt,
        retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000))
      };
    }

    return {
      ok: true,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - count),
      resetAt
    };
  } catch {
    return null;
  }
}

function checkMemoryRateLimit(key: string, policy: RateLimitPolicy, now: number): RateLimitResult {
  pruneBuckets(now);

  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + policy.windowMs });
    return {
      ok: true,
      limit: policy.limit,
      remaining: policy.limit - 1,
      resetAt: now + policy.windowMs
    };
  }

  if (current.count >= policy.limit) {
    return {
      ok: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  return {
    ok: true,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - current.count),
    resetAt: current.resetAt
  };
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "local";
}

function pruneBuckets(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
