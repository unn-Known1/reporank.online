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
          <RSSFeedLink />
        </div>
        <p className="blog-meta" style={{ marginTop: "0.5rem", color: "var(--color-text-secondary)" }}>
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
                className="blog-pagination-button"
                aria-disabled={page <= 1}
                onClick={(e) => page <= 1 && e.preventDefault()}
                style={{ pointerEvents: page <= 1 ? "none" : "auto" }}
              >
                Previous
              </a>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/blog?page=${p}${category ? `&category=${category}` : ""}`}
                  className="blog-pagination-button"
                  style={{
                    fontWeight: p === page ? "700" : "500",
                    borderColor: p === page ? "var(--color-primary)" : undefined,
                    color: p === page ? "var(--color-primary)" : undefined,
                  }}
                >
                  {p}
                </a>
              ))}
              <a
                href={`/blog?page=${page + 1}${category ? `&category=${category}` : ""}`}
                className="blog-pagination-button"
                aria-disabled={page >= pagination.total_pages}
                onClick={(e) => page >= pagination.total_pages && e.preventDefault()}
                style={{ pointerEvents: page >= pagination.total_pages ? "none" : "auto" }}
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
