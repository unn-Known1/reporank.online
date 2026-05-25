import { Worker } from 'bullmq'
import { getRedis } from './redis'
import { upsertRepoFromGitHub } from '@/lib/db/repos'
import { computeAndStoreScore } from '@/lib/db/scores'
import { maybeGenerateAiReview } from '@/lib/db/ai'
import { getUserTokenFromSession } from '@/lib/github/token'
import type { RepoScoringJob } from './index'

export function createScoringWorker(): Worker<RepoScoringJob> | null {
  try {
    const worker = new Worker<RepoScoringJob>(
      'repo-scoring',
      async (job) => {
        const { owner, name, triggeredByUserId } = job.data

        let userToken: string | undefined
        if (triggeredByUserId) {
          userToken = await getUserTokenFromSession(triggeredByUserId) ?? undefined
        }

        await job.updateProgress(10)
        const { dbRepo, rawRepo } = await upsertRepoFromGitHub(owner, name, userToken)

        if (!dbRepo) {
          throw new Error(`Failed to upsert repo ${owner}/${name}`)
        }

        await job.updateProgress(50)
        await computeAndStoreScore(dbRepo.id, rawRepo, owner, name)

        await job.updateProgress(75)
        await maybeGenerateAiReview(dbRepo.id, owner, name, { rawRepo })

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
