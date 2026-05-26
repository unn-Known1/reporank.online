export default function ExtensionLoading() {
  return (
    <section className="relative mx-auto max-w-5xl px-4 py-16">
      <div className="mb-14 text-center">
        <div className="mx-auto mb-6 h-6 w-40 animate-pulse rounded-full bg-[var(--color-surface-elevated)]" />
        <div className="mx-auto h-10 w-72 animate-pulse rounded bg-[var(--color-surface-elevated)] sm:h-12" />
        <div className="mx-auto mt-4 h-5 w-96 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
      </div>
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-2xl bg-[var(--color-surface-elevated)]" />
            <div className="mx-auto h-5 w-24 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            <div className="mx-auto mt-2 h-3 w-32 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-[var(--color-surface-elevated)]" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-16 max-w-2xl">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="mx-auto h-6 w-48 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-[var(--color-surface-elevated)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
                  <div className="h-3 w-48 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
