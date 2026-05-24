import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/blog/service";
import BlogPostContent from "@/components/blog/BlogPostContent";
import RepoReferenceCard from "@/components/blog/RepoReferenceCard";
import AiGeneratedBadge from "@/components/blog/AiGeneratedBadge";
import BlogJsonLd from "@/components/seo/BlogJsonLd";
import SocialShare from "@/components/blog/SocialShare";
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

  const title = post.seo_meta_title || post.title;
  const description = post.seo_meta_description || post.excerpt || "";
  const url = `${BASE_URL}/blog/${slug}`;

  return {
    title: `${title} — RepoRank Blog`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — RepoRank Blog`,
      description,
      url,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      ...(post.author?.name ? { authors: [post.author.name] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — RepoRank Blog`,
      description,
    },
  };
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

  return (
    <div className="blog-container">
      <BlogJsonLd
        title={post.seo_meta_title || post.title}
        description={post.seo_meta_description || post.excerpt || ""}
        url={postUrl}
        publishedAt={post.published_at ?? new Date().toISOString()}
        authorName={post.author?.name ?? "RepoRank"}
      />
      <article>
        <div className="blog-header">
          <h1>{post.title}</h1>
          <div className="blog-meta">
            {post.author && (
              <span>{post.author.name}</span>
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
          </div>
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
