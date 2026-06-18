import "server-only";

import { Redis } from "@upstash/redis";

import { appConfig, hasSharedStore } from "@/lib/config";

let redis: Redis | null | undefined;

export function getRedis() {
  if (!hasSharedStore()) return null;
  if (redis !== undefined) return redis;

  redis = new Redis({
    url: appConfig.upstashRedisRestUrl,
    token: appConfig.upstashRedisRestToken
  });
  return redis;
}
