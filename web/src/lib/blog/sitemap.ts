import { supabaseAdmin } from "@/lib/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export async function getBlogSitemapEntries() {
  const supabase = supabaseAdmin();

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error || !posts) {
    console.warn("[blog/sitemap] error fetching posts:", error?.message);
    return [];
  }

  return posts.map((post: { slug: string; published_at: string | null; updated_at: string | null }) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at ?? post.published_at!,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}
