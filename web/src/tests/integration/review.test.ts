import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/repo/[owner]/[name]/review/route'
import { NextRequest } from 'next/server'

const query = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
}))

const from = vi.hoisted(() => vi.fn().mockReturnValue(query))

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
    from,
  }),
  getUser: vi.fn().mockResolvedValue({ id: 'user-123' }),
}))

const validReview = {
  ratings: {
    codeQuality: 4,
    docs: 5,
    maintenance: 4,
    easeOfUse: 4,
    security: 4,
  },
  body: 'This is a solid and well-maintained project with clear documentation and responsive maintainers.',
}

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/repo/vercel/next.js/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  query.maybeSingle
    .mockResolvedValueOnce({ data: { id: 'repo-uuid', owner: 'vercel', name: 'next.js' }, error: null })
    .mockResolvedValue({ data: { id: 'review-uuid', repo_id: 'repo-uuid', ratings_json: validReview.ratings, body: validReview.body }, error: null })
  from.mockReturnValue(query)
})

describe('review submission', () => {
  it('accepts a valid review', async () => {
    const res = await POST(makeRequest(validReview), {
      params: { owner: 'vercel', name: 'next.js' },
    } as any)
    expect(res.status).toBe(201)
  })

  it('rejects a review with missing rating fields', async () => {
    const res = await POST(makeRequest({ ratings: {}, body: 'A long enough review body to pass the 50 character minimum threshold for this test.' }), {
      params: { owner: 'vercel', name: 'next.js' },
    } as any)
    expect(res.status).toBe(400)
  })

  it('rejects a review body under 50 characters', async () => {
    const res = await POST(
      makeRequest({ ...validReview, body: 'Too short.' }),
      { params: { owner: 'vercel', name: 'next.js' } } as any,
    )
    expect(res.status).toBe(400)
  })

  it('rejects a duplicate review', async () => {
    vi.mocked(from).mockClear()
    query.maybeSingle
      .mockReset()
      .mockResolvedValueOnce({ data: { id: 'repo-uuid' }, error: null })
      .mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } })
    const res = await POST(makeRequest(validReview), {
      params: { owner: 'vercel', name: 'next.js' },
    } as any)
    expect(res.status).toBe(409)
  })

  it('rejects when repo is not found', async () => {
    query.maybeSingle
      .mockReset()
      .mockResolvedValue({ data: null, error: null })
    const res = await POST(makeRequest(validReview), {
      params: { owner: 'unknown', name: 'repo' },
    } as any)
    expect(res.status).toBe(404)
  })
})
