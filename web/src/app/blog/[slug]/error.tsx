"use client";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const is404 = error.message?.includes("404") || error.digest?.includes("404");

  if (is404) {
    return (
      <div className="blog-container">
        <div className="blog-empty-state">
          <div className="blog-empty-state-title">Post not found</div>
          <p className="blog-empty-state-text">
            This blog post doesn&apos;t exist or has been removed.
          </p>
          <a
            href="/blog"
            className="mt-4 inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] no-underline"
          >
            Back to blog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="blog-empty-state">
        <div className="blog-empty-state-title">Something went wrong</div>
        <p className="blog-empty-state-text">
          We couldn&apos;t load this post. Please try again.
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
