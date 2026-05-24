import { Redis } from 'ioredis'

const globalRedis = global as typeof global & { redis?: Redis }

export function getRedisUrl(): string | null {
  return process.env.REDIS_URL ?? null
}

export function getRedis(): Redis {
  const url = getRedisUrl()
  if (!url) throw new Error('REDIS_URL not configured')
  if (!globalRedis.redis) {
    globalRedis.redis = new Redis(url, {
      maxRetriesPerRequest: null,
    })
  }
  return globalRedis.redis
}
