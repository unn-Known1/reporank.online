export default function BlogLoading() {
  return (
    <div className="blog-container">
      <div className="blog-header">
        <div className="h-8 w-32 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
        <div className="h-4 w-64 rounded bg-[var(--color-surface-elevated)] animate-pulse mt-2" />
      </div>
      <div className="blog-post-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="blog-post-card">
            <div className="h-6 w-3/4 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
            <div className="h-4 w-full rounded bg-[var(--color-surface-elevated)] animate-pulse mt-2" />
            <div className="h-4 w-2/3 rounded bg-[var(--color-surface-elevated)] animate-pulse mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
