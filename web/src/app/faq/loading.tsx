export default function FaqLoading() {
  return (
    <section className="relative mx-auto max-w-3xl px-4 py-16">
      <div className="mb-14 text-center">
        <div className="mx-auto mb-6 h-6 w-20 animate-pulse rounded-full bg-[var(--color-surface-elevated)]" />
        <div className="mx-auto h-10 w-48 animate-pulse rounded bg-[var(--color-surface-elevated)] sm:h-12" />
        <div className="mx-auto mt-4 h-5 w-96 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-[var(--color-surface-elevated)]" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
