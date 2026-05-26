"use client";

export default function CommunityBlogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="blog-container">
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Failed to load community posts.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
