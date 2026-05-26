export default function CommunityBlogLoading() {
  return (
    <div className="blog-container">
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-[var(--color-border)] p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-[var(--color-surface-elevated)]" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
