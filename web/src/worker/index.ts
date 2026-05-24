import { createScoringWorker } from '@/lib/queue/worker'

const worker = createScoringWorker()
if (!worker) {
  console.error('Failed to create worker — is REDIS_URL configured?')
  process.exit(1)
}

console.log('Worker started, waiting for jobs...')

process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})
