import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { fetchRepoFactors } from '@/lib/github/graphql'
import { mapRepoDataToFactors } from '@/lib/github/factors'
import { computeScore } from '@reporank/core'

const repoData = {
  stargazerCount: 1200,
  forkCount: 340,
  watchers: { totalCount: 42 },
  mentionableUsers: { totalCount: 12 },
  isArchived: false,
  isDisabled: false,
  description: 'A well-documented project',
  nameWithOwner: 'vercel/next.js',
  defaultBranchRef: {
    name: 'main',
    target: {
      committedDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  },
  commitHistory: {
    nodes: [
      { author: { user: { login: 'user1' } } },
      { author: { user: { login: 'user2' } } },
    ],
  },
  issues: { totalCount: 80 },
  closedIssues: { totalCount: 62 },
  pullRequests: {
    nodes: [
      { createdAt: '2025-01-01T00:00:00Z', mergedAt: '2025-01-02T00:00:00Z' },
    ],
  },
  releases: {
    nodes: [
      { publishedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    ],
  },
  readme: { text: '# My Repo\n\n## Installation\nnpm install\n\n## Usage\nUse it like this.\n\n## Example\nSee examples.\n\n### API\nDetails.' },
  securityMd: { text: '# Security Policy' },
  contributingMd: { text: '# Contributing Guide' },
  licenseInfo: { spdxId: 'MIT' },
  workflowsDir: { entries: [{ name: 'ci.yml' }] },
  packageJson: { text: '{"scripts":{"test":"jest"}}' },
  testsDir: null,
  specDir: null,
  dependentsCount: 150,
}

const mockGraphQL = { data: { repository: repoData } }

let origFetch: typeof global.fetch

beforeAll(() => { origFetch = global.fetch })
afterAll(() => { global.fetch = origFetch })

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === 'https://api.github.com/graphql') {
      return Promise.resolve(new Response(JSON.stringify(mockGraphQL), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    if (url.includes('dependency-graph/dependents')) {
      return Promise.resolve(new Response(JSON.stringify({ total_count: 150 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    return Promise.resolve(new Response('Not found', { status: 404 }))
  })
})

describe('lookup + score pipeline', () => {
  it('returns a score between 0 and 100', async () => {
    const repo = await fetchRepoFactors('vercel', 'next.js', 'mock-token')
    const factors = mapRepoDataToFactors(repo)
    const result = computeScore(factors)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('returns all 5 subscores', async () => {
    const repo = await fetchRepoFactors('vercel', 'next.js', 'mock-token')
    const factors = mapRepoDataToFactors(repo)
    const result = computeScore(factors)
    expect(result.subscores).toMatchObject({
      maintenance: expect.any(Number),
      community: expect.any(Number),
      security: expect.any(Number),
      documentation: expect.any(Number),
      adoption: expect.any(Number),
    })
  })

  it('is deterministic — same input produces same score', async () => {
    const repo = await fetchRepoFactors('vercel', 'next.js', 'mock-token')
    const factors = mapRepoDataToFactors(repo)
    const r1 = computeScore(factors)
    const r2 = computeScore(factors)
    expect(r1.total).toBe(r2.total)
  })

  it('scores a repo with no CI/tests lower than one with CI/tests', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://api.github.com/graphql') {
        const noCiData = { ...repoData, workflowsDir: null, testsDir: null, packageJson: { text: '{}' } }
        return Promise.resolve(new Response(JSON.stringify({ data: { repository: noCiData } }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.includes('dependency-graph/dependents')) {
        return Promise.resolve(new Response(JSON.stringify({ total_count: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      return Promise.resolve(new Response('Not found', { status: 404 }))
    })
    const noCiRepo = await fetchRepoFactors('owner', 'repo', 'mock-token')
    const scoreNoCi = computeScore(mapRepoDataToFactors(noCiRepo))

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://api.github.com/graphql') {
        return Promise.resolve(new Response(JSON.stringify(mockGraphQL), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.includes('dependency-graph/dependents')) {
        return Promise.resolve(new Response(JSON.stringify({ total_count: 150 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      return Promise.resolve(new Response('Not found', { status: 404 }))
    })
    const ciRepo = await fetchRepoFactors('vercel', 'next.js', 'mock-token')
    const scoreWithCi = computeScore(mapRepoDataToFactors(ciRepo))

    expect(scoreWithCi.subscores.security).toBeGreaterThan(scoreNoCi.subscores.security)
  })
})
