import { NextResponse } from 'next/server'
import { getRepoByOwnerName } from '@/lib/db/repos'
import { getLatestScore } from '@/lib/db/scores'
import { getReviewSummary } from '@/lib/db/reviews'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders, status: 204 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const platform = searchParams.get('platform') ?? 'github'
  const owner = searchParams.get('owner') ?? ''
  const name = searchParams.get('name') ?? ''

  if (!owner || !name) {
    return NextResponse.json({ error: 'Missing owner or name' }, { status: 400, headers: corsHeaders })
  }

  if (!['github', 'gitlab', 'npm'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400, headers: corsHeaders })
  }

  const repo = await getRepoByOwnerName(owner, name)
  if (!repo) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders })
  }

  const score = await getLatestScore(repo.id)
  const reviewSummary = await getReviewSummary(repo.id)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

  return NextResponse.json({
    total: score?.total_score ?? null,
    subscores: score?.subscores_json ?? null,
    verdict: null,
    reviewCount: reviewSummary.count,
    repoUrl: `${baseUrl}/${platform}/${owner}/${name}`,
  }, { headers: corsHeaders })
}
