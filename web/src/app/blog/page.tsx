import { listBlogPosts } from "@/lib/blog/service";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogEmptyState from "@/components/blog/BlogEmptyState";
import RSSFeedLink from "@/components/blog/RSSFeedLink";
import type { Metadata } from "next";
import "@/styles/blog.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — RepoRank",
  description: "Insights and analysis about GitHub repositories — repository credibility scores, best practices, and community health metrics.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online"}/blog` },
  openGraph: {
    title: "Blog — RepoRank",
    description: "Insights and analysis about GitHub repositories — repository credibility scores, best practices, and community health metrics.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — RepoRank",
    description: "Insights and analysis about GitHub repositories — repository credibility scores, best practices, and community health metrics.",
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const category = params.category;

  const { posts, pagination } = await listBlogPosts({
    page,
    limit: 20,
    category,
    includeDrafts: false,
  });

  return (
    <div className="blog-container">
      <div className="blog-header">
        <div className="flex items-center justify-between">
          <h1>Blog</h1>
          <div className="flex items-center gap-2">
            <a
              href="/blog/community"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Community
            </a>
            <RSSFeedLink />
          </div>
        </div>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Insights and analysis about GitHub repositories
        </p>
      </div>

      {posts.length === 0 ? (
        <BlogEmptyState />
      ) : (
        <>
          <div className="blog-post-list">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>

          {pagination.total_pages > 1 && (
            <div className="blog-pagination">
              <a
                href={`/blog?page=${page - 1}${category ? `&category=${category}` : ""}`}
                className={`blog-pagination-button ${page <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-disabled={page <= 1}
                onClick={(e) => page <= 1 && e.preventDefault()}
              >
                Previous
              </a>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/blog?page=${p}${category ? `&category=${category}` : ""}`}
                  className={`blog-pagination-button ${p === page ? "!border-[var(--color-primary)] !text-[var(--color-primary)] !font-bold" : ""}`}
                >
                  {p}
                </a>
              ))}
              <a
                href={`/blog?page=${page + 1}${category ? `&category=${category}` : ""}`}
                className={`blog-pagination-button ${page >= pagination.total_pages ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-disabled={page >= pagination.total_pages}
                onClick={(e) => page >= pagination.total_pages && e.preventDefault()}
              >
                Next
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
