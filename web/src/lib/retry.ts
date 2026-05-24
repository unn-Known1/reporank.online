function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jitter(ms: number): number {
  return Math.round(ms * (0.5 + Math.random() * 0.5))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3
  const baseDelayMs = options?.baseDelayMs ?? 1000

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if ((err as any)?.retryable === false) throw err
      if (attempt < maxAttempts) {
        const delay = jitter(baseDelayMs * Math.pow(2, attempt - 1))
        await sleep(delay)
      }
    }
  }

  throw lastError
}
