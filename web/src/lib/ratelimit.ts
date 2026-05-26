// Rate limiter — three-tier sliding window:
//   1. Redis (fast, distributed — primary)
//   2. Supabase RPC  (slower but shared across serverless instances)
//   3. In-memory Map (per-instance best-effort last resort)

import { Redis } from 'ioredis'
import { supabaseAdmin } from '@/lib/supabase/admin'

const WINDOW_MS = 60_000;          // 1 minute
const MAX_REQUESTS = 10;           // 10 requests per minute per IP per bucket
const REDIS_PREFIX = 'ratelimit:';
const FALLBACK_WINDOW_MS = 30_000; // shorter window for per-instance fallback
const CLEANUP_INTERVAL_MS = 60_000;

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

// Per-bucket in-memory fallback (last resort — per-instance only)
const localBuckets = new Map<string, { timestamps: number[] }>();
let lastGlobalCleanup = 0;

function cleanupLocalBuckets(now: number) {
  if (now - lastGlobalCleanup < CLEANUP_INTERVAL_MS) return;
  lastGlobalCleanup = now;
  for (const [key, entry] of localBuckets) {
    entry.timestamps = entry.timestamps.filter(t => now - t < FALLBACK_WINDOW_MS);
    if (entry.timestamps.length === 0) {
      localBuckets.delete(key);
    }
  }
}

// ── Tier 1: Redis (sorted-set sliding window) ────────────────────────────────

// Lua script for atomic check-and-add
const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return {0, window - (now - tonumber(oldest[2]))}
end
redis.call('ZADD', key, now, now)
redis.call('EXPIRE', key, math.ceil(window / 1000))
return {1, 0}
`;

async function redisCheck(
  redis: Redis,
  bucket: string,
  now: number,
  limit: number,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const key = `${REDIS_PREFIX}${bucket}`;

  const result = await redis.eval(
    RATE_LIMIT_SCRIPT,
    1,
    key,
    now,
    WINDOW_MS,
    limit,
  ) as [number, number];

  return {
    allowed: result[0] === 1,
    retryAfterMs: Math.max(0, result[1]),
  };
}

// ── Tier 2: Supabase RPC (database-backed, shared across instances) ──────────
async function dbCheck(
  bucket: string,
  limit: number,
): Promise<{ allowed: boolean; retryAfterMs: number } | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc('check_rate_limit_db', {
    p_bucket: bucket,
    p_max_requests: limit,
    p_window_ms: WINDOW_MS,
  });

  if (error) return null;

  const result = data as { allowed: boolean; retry_after_ms: number } | null;
  if (!result) return null;

  return {
    allowed: result.allowed,
    retryAfterMs: result.retry_after_ms ?? 0,
  };
}

// ── Tier 3: Per-instance in-memory (best-effort) ─────────────────────────────
function localCheck(
  bucket: string,
  now: number,
  limit: number,
): { allowed: boolean; retryAfterMs: number } {
  cleanupLocalBuckets(now);

  let entry = localBuckets.get(bucket);
  if (!entry) {
    entry = { timestamps: [] };
    localBuckets.set(bucket, entry);
  }

  const recent = entry.timestamps.filter(t => now - t < FALLBACK_WINDOW_MS);
  if (recent.length >= limit) {
    const oldestInWindow = recent[0];
    const retryAfterMs = FALLBACK_WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  recent.push(now);
  entry.timestamps = recent;
  return { allowed: true, retryAfterMs: 0 };
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function checkRateLimit(
  ip: string,
  bucketPrefix?: string,
  maxRequests?: number,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = Date.now();
  const bucket = bucketPrefix ? `${bucketPrefix}${ip}` : ip;
  const limit = maxRequests ?? MAX_REQUESTS;

  // Tier 1: Redis (fast, distributed)
  const redis = getRedisClient();
  if (redis) {
    try {
      return await redisCheck(redis, bucket, now, limit);
    } catch {
      // Redis error — fall through
    }
  }

  // Tier 2: Supabase RPC (shared across serverless instances)
  const dbResult = await dbCheck(bucket, limit).catch(() => null);
  if (dbResult) return dbResult;

  // Tier 3: In-memory (per-instance best-effort)
  return localCheck(bucket, now, limit);
}
