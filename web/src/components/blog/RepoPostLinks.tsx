import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

interface RepoPostLinksProps {
  owner: string;
  name: string;
}

export default async function RepoPostLinks({ owner, name }: RepoPostLinksProps) {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data: links } = await supabase
    .from("blog_post_repos")
    .select("post_id")
    .eq("repo_owner", owner)
    .eq("repo_name", name);

  if (!links || links.length === 0) return null;

  const postIds = links.map((l) => l.post_id);

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, published_at")
    .in("id", postIds)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
        Referenced in blog posts
      </h3>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/blog/${post.slug}`}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
