import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAiReview, maybeGenerateAiReview } from '@/lib/db/ai'

const query = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  insert: vi.fn().mockResolvedValue({ error: null }),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
}))

const serverFrom = vi.hoisted(() => vi.fn().mockReturnValue(query))

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
    from: serverFrom,
  }),
}))

const adminInsert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }))

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'ai_reviews') return query
      return { insert: adminInsert }
    }),
  }),
}))

vi.mock('@/lib/env', () => ({
  requireEnv: (name: string) => {
    const envs: Record<string, string> = {
      GITHUB_APP_TOKEN: 'mock-token',
      ANTHROPIC_API_KEY: 'mock-key',
    }
    const v = envs[name] ?? process.env[name]
    if (!v) throw new Error(`Missing required env: ${name}`)
    return v
  },
}))

const validAiResponse = {
  summary: 'Well-maintained project with active community and solid CI practices.',
  strengths: ['Strong documentation', 'Active maintenance', 'Good community'],
  concerns: ['Minor issue response delays'],
  verdict: 'RECOMMENDED',
  bestFor: 'Production applications needing reliable dependencies',
  redFlags: [],
}

function makeGitHubResponse(overrides?: Record<string, unknown>) {
  const repo = {
    stargazerCount: 500,
    forkCount: 100,
    watchers: { totalCount: 20 },
    mentionableUsers: { totalCount: 8 },
    isArchived: false,
    isDisabled: false,
    description: 'A test repo',
    nameWithOwner: 'owner/repo',
    defaultBranchRef: { name: 'main', target: { committedDate: new Date().toISOString() } },
    commitHistory: { nodes: [{ author: { user: { login: 'dev1' } } }] },
    issues: { totalCount: 10 },
    closedIssues: { totalCount: 7 },
    pullRequests: { nodes: [] },
    releases: { nodes: [] },
    readme: { text: '# Test' },
    securityMd: { text: '# Security' },
    contributingMd: null,
    licenseInfo: { spdxId: 'MIT' },
    workflowsDir: { entries: [{ name: 'ci.yml' }] },
    packageJson: { text: '{}' },
    testsDir: null,
    specDir: null,
    ...overrides,
  }
  return { data: { repository: repo } }
}

let origFetch: typeof global.fetch

beforeEach(() => {
  origFetch = global.fetch
  vi.clearAllMocks()
})

afterEach(() => {
  global.fetch = origFetch
})

describe('AI analysis', () => {
  it('parses a valid schema-conforming response from the DB', async () => {
    query.maybeSingle.mockResolvedValue({
      data: {
        id: 'ai-1',
        repo_id: 'repo-1',
        generated_at: new Date().toISOString(),
        model_used: 'claude-sonnet-4-20250514',
        scores_json: { maintenance: 82, community: 74, security: 79, documentation: 68, adoption: 85 },
        evidence_json: {},
        summary: 'Great project',
        injection_flagged: false,
      },
      error: null,
    })

    const result = await getAiReview('repo-1')
    expect(result).not.toBeNull()
    expect(result!.scores_json.maintenance).toBe(82)
    expect(result!.injection_flagged).toBe(false)
  })

  it('returns null when no AI review exists', async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await getAiReview('repo-nonexistent')
    expect(result).toBeNull()
  })

  it('generates and stores an AI review via full pipeline', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeGitHubResponse()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ total_count: 50 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(validAiResponse) }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    query.maybeSingle.mockResolvedValue({ data: null, error: null })

    await maybeGenerateAiReview('repo-1', 'owner', 'repo')

    expect(query.insert).toHaveBeenCalledTimes(1)
    const insertArg = query.insert.mock.calls[0][0]
    expect(insertArg.summary).toBe(validAiResponse.summary)
    expect(insertArg.verdict).toBe('RECOMMENDED')
    expect(insertArg.injection_flagged).toBe(false)
  })

  it('skips generation if recent AI review exists', async () => {
    query.maybeSingle.mockResolvedValue({
      data: {
        id: 'ai-existing',
        repo_id: 'repo-1',
        generated_at: new Date().toISOString(),
        model_used: 'claude-sonnet-4-20250514',
        scores_json: { maintenance: 80, community: 70, security: 75, documentation: 65, adoption: 80 },
        evidence_json: {},
        summary: 'Existing review',
        injection_flagged: false,
      },
      error: null,
    })

    await maybeGenerateAiReview('repo-1', 'owner', 'repo')

    expect(query.insert).not.toHaveBeenCalled()
  })
})
