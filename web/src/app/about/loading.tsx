export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
      <div className="mt-8 space-y-4">
        <div className="h-4 w-full animate-pulse rounded bg-[var(--color-surface-elevated)]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
      </div>
    </div>
  );
}
