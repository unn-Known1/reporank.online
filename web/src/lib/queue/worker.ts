import { Worker } from 'bullmq'
import { getRedis } from './redis'
import { upsertRepoFromGitHub } from '@/lib/db/repos'
import { computeAndStoreScore } from '@/lib/db/scores'
import { maybeGenerateAiReview } from '@/lib/db/ai'
import type { RepoScoringJob } from './index'

export function createScoringWorker(): Worker<RepoScoringJob> | null {
  try {
    const worker = new Worker<RepoScoringJob>(
      'repo-scoring',
      async (job) => {
        const { owner, name, token } = job.data

        await job.updateProgress(10)
        const { dbRepo, rawRepo } = await upsertRepoFromGitHub(owner, name, token)

        if (!dbRepo) {
          throw new Error(`Failed to upsert repo ${owner}/${name}`)
        }

        await job.updateProgress(50)
        await computeAndStoreScore(dbRepo.id, rawRepo)

        await job.updateProgress(75)
        await maybeGenerateAiReview(dbRepo.id, owner, name, { rawRepo, token })

        await job.updateProgress(100)
        return { repoId: dbRepo.id }
      },
      {
        connection: getRedis(),
        concurrency: 5,
      },
    )

    worker.on('failed', (j, err) => {
      console.error(`[worker] Job ${j?.id} failed:`, err.message)
    })

    return worker
  } catch {
    return null
  }
}
