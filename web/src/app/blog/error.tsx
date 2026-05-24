"use client";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="blog-container">
      <div className="blog-empty-state">
        <div className="blog-empty-state-title">Something went wrong</div>
        <p className="blog-empty-state-text">
          We couldn&apos;t load the blog. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
