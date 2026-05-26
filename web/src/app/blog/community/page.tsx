import { listBlogPosts } from "@/lib/blog/service";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogEmptyState from "@/components/blog/BlogEmptyState";
import RSSFeedLink from "@/components/blog/RSSFeedLink";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import type { Metadata } from "next";
import "@/styles/blog.css";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export const metadata: Metadata = {
  title: "Community Blog — RepoRank",
  description: "Community-written posts about GitHub repositories — insights, tutorials, and deep dives from developers like you.",
  alternates: { canonical: `${BASE_URL}/blog/community` },
  openGraph: {
    title: "Community Blog — RepoRank",
    description: "Community-written posts about GitHub repositories.",
    url: `${BASE_URL}/blog/community`,
  },
};

export default async function CommunityBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; sort?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const tag = resolvedParams.tag || undefined;
  const sort = (resolvedParams.sort === "popular" ? "popular" : "latest") as "latest" | "popular";

  const { posts, pagination } = await listBlogPosts({
    page,
    limit: 20,
    includeDrafts: false,
    type: "user",
    tag,
    sort,
  });

  const breadcrumbItems = [
    { name: "Blog", url: "/blog" },
    { name: "Community", url: "/blog/community" },
  ];

  return (
    <div className="blog-container">
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Community Blog</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Posts from developers like you
          </p>
        </div>
        <RSSFeedLink href="/blog/community/feed.xml" />
      </div>

      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-secondary)]">Filtered by tag:</span>
          <span className="inline-flex items-center rounded-md bg-[var(--color-surface-elevated)] px-2.5 py-1 text-sm font-medium text-[var(--color-primary)]">
            #{tag}
          </span>
        </div>
      )}

      {posts.length === 0 ? (
        <BlogEmptyState message="No community posts yet. Be the first to write!" />
      ) : (
        <>
          <div className="blog-post-list">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="blog-pagination">
            {pagination.page > 1 && (
              <a
                href={`/blog/community?page=${pagination.page - 1}${tag ? `&tag=${tag}` : ""}${sort !== "latest" ? `&sort=${sort}` : ""}`}
                className="blog-pagination-button"
              >
                Previous
              </a>
            )}
            <span className="text-sm text-[var(--color-text-muted)]">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            {pagination.page < pagination.total_pages && (
              <a
                href={`/blog/community?page=${pagination.page + 1}${tag ? `&tag=${tag}` : ""}${sort !== "latest" ? `&sort=${sort}` : ""}`}
                className="blog-pagination-button"
              >
                Next
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
