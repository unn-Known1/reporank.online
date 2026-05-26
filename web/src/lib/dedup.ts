const MAX_AGE_MS = 30_000
const CLEANUP_INTERVAL_MS = 60_000

type Entry = {
  promise: Promise<unknown>
  timestamp: number
}

const inFlight = new Map<string, Entry>()
let lastCleanup = 0

function pruneStale(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of inFlight) {
    if (now - entry.timestamp > MAX_AGE_MS) {
      inFlight.delete(key)
    }
  }
}

export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  pruneStale()

  const existing = inFlight.get(key)
  if (existing) return existing.promise as Promise<T>

  const promise = fn().finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, { promise, timestamp: Date.now() })
  return promise
}
