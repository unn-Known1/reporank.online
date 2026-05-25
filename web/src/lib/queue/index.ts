import { Queue } from 'bullmq'
import { getRedisUrl, getRedis } from './redis'

// SECURITY: Do NOT add a token field here. Raw OAuth tokens must never be stored in Redis.
// The synchronous fallback path passes the token in-memory only.
// If the worker needs a user token, fetch from session at execution time via triggeredByUserId.
export type RepoScoringJob = {
  owner: string
  name: string
  triggeredByUserId?: string
}

let _queue: Queue<RepoScoringJob> | null = null

export function getScoringQueue(): Queue<RepoScoringJob> | null {
  if (!getRedisUrl()) return null
  if (!_queue) {
    _queue = new Queue<RepoScoringJob>('repo-scoring', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      },
    })
  }
  return _queue
}
