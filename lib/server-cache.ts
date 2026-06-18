import "server-only";

import { getRedis } from "@/lib/redis";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export async function getCachedValue<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (redis) {
    try {
      const value = await redis.get<T>(key);
      return value ?? null;
    } catch {
      return getMemoryValue<T>(key);
    }
  }

  return getMemoryValue<T>(key);
}

export async function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, value, { ex: Math.max(1, Math.ceil(ttlMs / 1000)) });
      return;
    } catch {
      setMemoryValue(key, value, ttlMs);
      return;
    }
  }

  setMemoryValue(key, value, ttlMs);
}

function getMemoryValue<T>(key: string) {
  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setMemoryValue<T>(key: string, value: T, ttlMs: number) {
  memoryCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value
  });
}
