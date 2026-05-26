export default function UserPostsLoading() {
  return (
    <div className="blog-container">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--color-surface-elevated)]" />
          <div>
            <div className="h-6 w-32 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            <div className="mt-1 h-4 w-20 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-[var(--color-border)] p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-[var(--color-surface-elevated)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
