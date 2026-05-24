import Link from "next/link";
import AiGeneratedBadge from "@/components/blog/AiGeneratedBadge";

interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    published_at: string | null;
    ai_generated: boolean;
    category?: { id: string; name: string; slug: string } | null;
    author?: { id: string; name: string | null } | null;
  };
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
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

        {post.excerpt && (
          <p className="blog-post-card-excerpt">{post.excerpt}</p>
        )}
      </article>
    </Link>
  );
}
