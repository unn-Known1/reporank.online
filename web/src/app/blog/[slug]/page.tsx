import { notFound } from "next/navigation";
import { getBlogPostBySlug, getReadingTime } from "@/lib/blog/service";
import BlogPostContent from "@/components/blog/BlogPostContent";
import RepoReferenceCard from "@/components/blog/RepoReferenceCard";
import AiGeneratedBadge from "@/components/blog/AiGeneratedBadge";
import AuthorBadge from "@/components/blog/AuthorBadge";
import ReadingTime from "@/components/blog/ReadingTime";
import TagBadge from "@/components/blog/TagBadge";
import BlogJsonLd from "@/components/seo/BlogJsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import SocialShare from "@/components/blog/SocialShare";
import { buildOgImageUrl } from "@/lib/blog/seo";
import type { Metadata } from "next";
import "@/styles/blog.css";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== "published") {
    return { title: "Post Not Found — RepoRank" };
  }

  const title = post.seo_meta_title || `${post.title} — ${post.author?.name ?? "RepoRank"} on RepoRank`;
  const description = post.seo_meta_description || post.excerpt || "";
  const url = `${BASE_URL}/blog/${slug}`;
  const ogImage = buildOgImageUrl(slug);

  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      publishedTime: post.published_at ?? undefined,
      ...(post.author?.name ? { authors: [post.author.name] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };

  if (post.word_count < 300) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const postUrl = `${BASE_URL}/blog/${slug}`;
  const ogImage = buildOgImageUrl(slug);
  const readingTime = getReadingTime(post.word_count);
  const isUserPost = post.type === "user";

  const breadcrumbItems = [
    { name: "Blog", url: "/blog" },
    ...(isUserPost ? [{ name: "Community", url: "/blog/community" }] : []),
    { name: post.title, url: `/blog/${slug}` },
  ];

  return (
    <div className="blog-container">
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <BlogJsonLd
        title={post.seo_meta_title || post.title}
        description={post.seo_meta_description || post.excerpt || ""}
        url={postUrl}
        publishedAt={post.published_at ?? new Date().toISOString()}
        updatedAt={post.updated_at}
        authorName={post.author?.name ?? "RepoRank"}
        authorUrl={isUserPost && post.author?.id ? `/user/${post.author.id}/posts` : undefined}
        image={ogImage}
        readingTimeMinutes={Math.max(1, Math.ceil(post.word_count / 200))}
      />

      <article>
        <div className="blog-header">
          <h1>{post.title}</h1>
          <div className="blog-meta">
            {post.author && (
              <span>
                {isUserPost ? (
                  <a
                    href={`/user/${post.author.id}/posts`}
                    className="hover:text-[var(--color-primary)] transition-colors"
                  >
                    {post.author.name}
                  </a>
                ) : (
                  post.author.name
                )}
              </span>
            )}
            {post.author && post.published_at && (
              <span className="blog-meta-separator" />
            )}
            {post.published_at && (
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
            <span className="blog-meta-separator" />
            <ReadingTime wordCount={post.word_count} />
            {post.category && (
              <>
                <span className="blog-meta-separator" />
                <span className="blog-category-badge">{post.category.name}</span>
              </>
            )}
            {post.ai_generated && (
              <>
                <span className="blog-meta-separator" />
                <AiGeneratedBadge />
              </>
            )}
            <span className="blog-meta-separator" />
            <AuthorBadge type={post.type} />
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>

        <div className="blog-post-body">
          <BlogPostContent html={post.body_html} />
        </div>

        {post.repos.length > 0 && (
          <div className="repo-card-list">
            {post.repos.map((repo) => (
              <RepoReferenceCard
                key={`${repo.owner}/${repo.name}`}
                owner={repo.owner}
                name={repo.name}
              />
            ))}
          </div>
        )}

        <SocialShare
          url={postUrl}
          title={post.title}
          description={post.excerpt ?? ""}
        />
      </article>
    </div>
  );
}
