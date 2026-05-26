import Link from "next/link";
import AiGeneratedBadge from "@/components/blog/AiGeneratedBadge";
import AuthorBadge from "@/components/blog/AuthorBadge";
import ReadingTime from "@/components/blog/ReadingTime";
import TagBadge from "@/components/blog/TagBadge";

interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    published_at: string | null;
    ai_generated: boolean;
    type?: "admin" | "user";
    tags?: string[];
    word_count?: number;
    category?: { id: string; name: string; slug: string } | null;
    author?: { id: string; name: string | null } | null;
  };
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const isUserPost = post.type === "user";

  return (
    <Link href={`/blog/${post.slug}`} className="blog-post-card no-underline">
      <article>
        <h2 className="blog-post-card-title">{post.title}</h2>

        <div className="blog-meta">
          {post.author?.name && (
            <span>{post.author.name}</span>
          )}
          {post.published_at && (
            <>
              <span className="blog-meta-separator" />
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </>
          )}
          {post.word_count !== undefined && post.word_count > 0 && (
            <>
              <span className="blog-meta-separator" />
              <ReadingTime wordCount={post.word_count} />
            </>
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
          {post.type && (
            <>
              <span className="blog-meta-separator" />
              <AuthorBadge type={post.type} />
            </>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {post.tags.length > 4 && (
              <span className="text-xs text-[var(--color-text-muted)]">
                +{post.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {post.excerpt && (
          <p className="blog-post-card-excerpt">{post.excerpt}</p>
        )}
      </article>
    </Link>
  );
}
