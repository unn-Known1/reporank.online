export default function BlogEmptyState({ message, title }: { message?: string; title?: string }) {
  return (
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
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <div className="blog-empty-state-title">{title ?? "No blog posts yet"}</div>
      <p className="blog-empty-state-text">
        {message ?? "Check back soon for insights and analysis about GitHub repositories."}
      </p>
    </div>
  );
}
