import { NextResponse } from 'next/server'
import { getScoringQueue } from '@/lib/queue'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params;
  const queue = getScoringQueue()
  if (!queue) {
    return NextResponse.json({ error: 'Queue not available' }, { status: 503 })
  }

  const job = await queue.getJob(id)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const state = await job.getState()

  return NextResponse.json({
    status: state,
    progress: job.progress,
    result: state === 'completed' ? job.returnvalue : null,
    error: state === 'failed' ? job.failedReason : null,
  })
  } catch (err) {
    console.error('[job] Error fetching job:', err)
    return NextResponse.json({ error: 'Failed to fetch job status' }, { status: 500 })
  }
}
