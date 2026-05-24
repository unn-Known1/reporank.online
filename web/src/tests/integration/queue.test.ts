import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('queue infrastructure', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('getRedisUrl returns null when REDIS_URL is not set', async () => {
    delete process.env.REDIS_URL
    const { getRedisUrl } = await import('@/lib/queue/redis')
    expect(getRedisUrl()).toBeNull()
  })

  it('getRedisUrl returns the URL when REDIS_URL is set', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379'
    const { getRedisUrl } = await import('@/lib/queue/redis')
    expect(getRedisUrl()).toBe('redis://localhost:6379')
    delete process.env.REDIS_URL
  })

  it('getScoringQueue returns null when REDIS_URL is not set', async () => {
    delete process.env.REDIS_URL
    const { getScoringQueue } = await import('@/lib/queue')
    expect(getScoringQueue()).toBeNull()
  })
})

describe('lookup route with queue', () => {
  const mockAdd = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'job-123' }))

  vi.mock('bullmq', () => ({
    Queue: vi.fn().mockImplementation(() => ({
      add: mockAdd,
      getJob: vi.fn(),
    })),
    Worker: vi.fn(),
  }))

  const MockRedis = vi.hoisted(() => vi.fn().mockImplementation(() => ({})))

  vi.mock('ioredis', () => ({ default: MockRedis, Redis: MockRedis }))

  vi.mock('@/lib/db/repos', () => ({
    getRepoByOwnerName: vi.fn().mockResolvedValue(null),
    upsertRepoFromGitHub: vi.fn(),
  }))

  vi.mock('@/lib/github/token', () => ({
    getGitHubToken: vi.fn().mockResolvedValue({ token: 'mock-token', isUserToken: false }),
  }))

  beforeEach(() => {
    process.env.REDIS_URL = 'redis://localhost:6379'
  })

  afterEach(() => {
    delete process.env.REDIS_URL
  })

  it('returns 202 when queue is available', async () => {
    const { POST } = await import('@/app/api/repo/lookup/route')
    const req = new Request('http://localhost/api/repo/lookup', {
      method: 'POST',
      body: JSON.stringify({ input: 'owner/repo' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.status).toBe('queued')
    expect(body.jobId).toBe('job-123')
  })

  it('returns cached status when repo was recently fetched', async () => {
    const { getRepoByOwnerName } = await import('@/lib/db/repos')
    vi.mocked(getRepoByOwnerName).mockResolvedValueOnce({
      id: 'repo-1',
      last_fetched_at: new Date().toISOString(),
    } as any)

    const { POST } = await import('@/app/api/repo/lookup/route')
    const req = new Request('http://localhost/api/repo/lookup', {
      method: 'POST',
      body: JSON.stringify({ input: 'owner/repo' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('cached')
    expect(body.repoId).toBe('repo-1')
  })
})
