// Rate limiter — Redis-backed sliding window with in-memory fallback

import { Redis } from 'ioredis'

const WINDOW_MS = 60_000;   // 1 minute
const MAX_LOOKUPS = 10;    // 10 lookups per minute per IP
const REDIS_PREFIX = 'ratelimit:';

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  try {
    const { getRedis } = require('./queue/redis');
    redisClient = getRedis();
    return redisClient;
  } catch {
    return null;
  }
}

// In-memory fallback
const localRequests = new Map<string, number[]>();

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = Date.now();

  // Try Redis first
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `${REDIS_PREFIX}${ip}`;
      const result = await redis
        .multi()
        .zremrangebyscore(key, 0, now - WINDOW_MS)
        .zcard(key)
        .zadd(key, now, `${now}-${Math.random()}`)
        .expire(key, Math.ceil(WINDOW_MS / 1000))
        .exec();

      if (result) {
        const count = result[1][1] as number;
        if (count >= MAX_LOOKUPS) {
          const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
          const oldestTimestamp = parseInt(oldest[1] ?? '0', 10);
          const retryAfterMs = WINDOW_MS - (now - oldestTimestamp);
          return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
        }
        return { allowed: true, retryAfterMs: 0 };
      }
    } catch {
      // Redis error — fall through to in-memory fallback
    }
  }

  // In-memory fallback
  const timestamps = localRequests.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_LOOKUPS) {
    const oldestInWindow = recent[0];
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, retryAfterMs };
  }

  recent.push(now);
  localRequests.set(ip, recent);
  return { allowed: true, retryAfterMs: 0 };
}
