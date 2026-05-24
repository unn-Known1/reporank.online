import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <div className="blog-container">
      <div className="blog-empty-state">
        <div className="blog-empty-state-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="blog-empty-state-title">Post not found</div>
        <p className="blog-empty-state-text">
          This blog post doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/blog"
          className="mt-4 inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] no-underline"
        >
          &larr; Back to blog
        </Link>
      </div>
    </div>
  );
}
