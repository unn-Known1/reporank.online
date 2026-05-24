export default function BlogPostLoading() {
  return (
    <div className="blog-container">
      <div className="h-10 w-3/4 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
      <div className="flex gap-3 mt-3">
        <div className="h-4 w-24 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
        <div className="h-4 w-32 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
      </div>
      <div className="mt-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-[var(--color-surface-elevated)] animate-pulse" />
        ))}
        <div className="h-4 w-3/4 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
      </div>
    </div>
  );
}
