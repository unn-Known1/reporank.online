import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderBadgeSvg } from '@/lib/badge/svg'

describe('badge SVG rendering', () => {
  it('renders a valid SVG with score + grade', () => {
    const svg = renderBadgeSvg(85)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('85')
    expect(svg).toContain('A')
    expect(svg).toContain('REPORANK')
  })

  it('renders em dash for null score', () => {
    const svg = renderBadgeSvg(null)
    expect(svg).toContain('\u2014')
  })

  it('uses emerald color for score >= 85', () => {
    const svg = renderBadgeSvg(85)
    expect(svg).toContain('#059669')
  })

  it('uses cyan color for score 70-84', () => {
    const svg = renderBadgeSvg(70)
    expect(svg).toContain('#0891b2')
  })

  it('uses amber color for score 50-69', () => {
    const svg = renderBadgeSvg(55)
    expect(svg).toContain('#d97706')
  })

  it('uses orange color for score 25-44', () => {
    const svg = renderBadgeSvg(30)
    expect(svg).toContain('#ea580c')
  })

  it('uses red color for score < 25', () => {
    const svg = renderBadgeSvg(20)
    expect(svg).toContain('#dc2626')
  })

  it('uses gray color for null score', () => {
    const svg = renderBadgeSvg(null)
    expect(svg).toContain('#64748b')
  })

  it('shows grade letter', () => {
    expect(renderBadgeSvg(90)).toContain('A')
    expect(renderBadgeSvg(75)).toContain('B')
    expect(renderBadgeSvg(60)).toContain('C')
    expect(renderBadgeSvg(40)).toContain('D')
    expect(renderBadgeSvg(20)).toContain('F')
    expect(renderBadgeSvg(null)).toContain('\u2014')
  })

  it('includes brand name', () => {
    const svg = renderBadgeSvg(50)
    expect(svg).toContain('REPORANK')
  })

  it('returns correct content type header', () => {
    const svg = renderBadgeSvg(50)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })
})

describe('badge API endpoint', () => {
  const mockGetRepo = vi.hoisted(() => vi.fn())
  const mockGetScore = vi.hoisted(() => vi.fn())

  vi.mock('@/lib/db/repos', () => ({
    getRepoByOwnerName: mockGetRepo,
  }))

  vi.mock('@/lib/db/scores', () => ({
    getLatestScore: mockGetScore,
  }))

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with SVG for a known repo', async () => {
    mockGetRepo.mockResolvedValue({ id: 'repo-1', full_name: 'vercel/next.js' })
    mockGetScore.mockResolvedValue({ total_score: 85 })

    const { GET } = await import('@/app/api/badge/[owner]/[name].svg/route')
    const res = await GET(new Request('http://localhost/api/badge/vercel/next.js.svg'), {
      params: { owner: 'vercel', name: 'next.js.svg' },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/svg+xml')
    const body = await res.text()
    expect(body).toContain('85')
  })

  it('returns 404 for unknown repo', async () => {
    mockGetRepo.mockResolvedValue(null)

    const { GET } = await import('@/app/api/badge/[owner]/[name].svg/route')
    const res = await GET(new Request('http://localhost/api/badge/nobody/missing.svg'), {
      params: { owner: 'nobody', name: 'missing.svg' },
    })

    expect(res.status).toBe(404)
  })

  it('sets cache-control header', async () => {
    mockGetRepo.mockResolvedValue({ id: 'repo-1', full_name: 'vercel/next.js' })
    mockGetScore.mockResolvedValue({ total_score: 85 })

    const { GET } = await import('@/app/api/badge/[owner]/[name].svg/route')
    const res = await GET(new Request('http://localhost/api/badge/vercel/next.js.svg'), {
      params: { owner: 'vercel', name: 'next.js.svg' },
    })

    const cache = res.headers.get('cache-control') ?? ''
    expect(cache).toMatch(/max-age/i)
    expect(cache).toContain('3600')
  })

  it('renders em dash when no score exists', async () => {
    mockGetRepo.mockResolvedValue({ id: 'repo-1', full_name: 'vercel/next.js' })
    mockGetScore.mockResolvedValue(null)

    const { GET } = await import('@/app/api/badge/[owner]/[name].svg/route')
    const res = await GET(new Request('http://localhost/api/badge/vercel/next.js.svg'), {
      params: { owner: 'vercel', name: 'next.js.svg' },
    })

    const body = await res.text()
    expect(body).toContain('\u2014')
  })
})
