import { describe, it, expect, vi } from 'vitest'

const mockGetSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: () => ({
    auth: { getSession: mockGetSession },
  }),
}))

vi.mock('@/lib/env', () => ({
  requireEnv: (name: string) => {
    if (name === 'GITHUB_APP_TOKEN') return 'app-token-fallback'
    throw new Error(`Missing: ${name}`)
  },
}))

describe('getGitHubToken', () => {
  it('uses provider_token when user is authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { provider_token: 'user-github-token-xyz' } },
    } as any)

    const { getGitHubToken } = await import('@/lib/github/token')
    const { token, isUserToken } = await getGitHubToken()
    expect(token).toBe('user-github-token-xyz')
    expect(isUserToken).toBe(true)
  })

  it('falls back to app token when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    } as any)

    const { getGitHubToken } = await import('@/lib/github/token')
    const { token, isUserToken } = await getGitHubToken()
    expect(token).toBe('app-token-fallback')
    expect(isUserToken).toBe(false)
  })

  it('falls back to app token when provider_token is missing from session', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    } as any)

    const { getGitHubToken } = await import('@/lib/github/token')
    const { token, isUserToken } = await getGitHubToken()
    expect(token).toBe('app-token-fallback')
    expect(isUserToken).toBe(false)
  })
})
