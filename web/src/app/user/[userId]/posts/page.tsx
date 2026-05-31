import { notFound } from "next/navigation";
import { listBlogPosts } from "@/lib/blog/service";
import { getProfileByUserId } from "@/lib/db/user-blog-profiles";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogEmptyState from "@/components/blog/BlogEmptyState";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import Image from "next/image";
import type { Metadata } from "next";
import "@/styles/blog.css";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getProfileByUserId(userId);
  const displayName = profile?.display_name ?? userId.slice(0, 8);

  return {
    title: `${displayName} — Posts on RepoRank`,
    description: `Blog posts by ${displayName} on RepoRank community blog.`,
    alternates: { canonical: `${BASE_URL}/user/${userId}/posts` },
  };
}

export default async function UserPostsPage({ params, searchParams }: Props) {
  const { userId } = await params;
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);

  const profile = await getProfileByUserId(userId);
  const displayName = profile?.display_name ?? userId.slice(0, 8);

  const { posts, pagination } = await listBlogPosts({
    page,
    limit: 20,
    author: userId,
    includeDrafts: false,
  });

  if (posts.length === 0 && page > 1) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Community", url: "/blog/community" },
    { name: displayName, url: `/user/${userId}/posts` },
  ];

  const postCountText = `${pagination.total} post${pagination.total === 1 ? "" : "s"}`;

  return (
    <div className="blog-container">
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="mb-8">
        <div className="flex items-center gap-3">
          {profile?.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{displayName}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{postCountText}</p>
          </div>
        </div>
        {profile?.bio && (
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{profile.bio}</p>
        )}
        {profile?.github_url && (
          <a
            href={profile.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub Profile
          </a>
        )}
      </div>

      {posts.length === 0 ? (
        <BlogEmptyState message={`${displayName} hasn't published any posts yet.`} />
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
                href={`/user/${userId}/posts?page=${pagination.page - 1}`}
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
                href={`/user/${userId}/posts?page=${pagination.page + 1}`}
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
