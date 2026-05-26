import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type BlogPostStatus = "draft" | "published";

export interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  author_id: string;
  published_at: string | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  category_id: string | null;
  status: BlogPostStatus;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListParams {
  page?: number;
  limit?: number;
  category?: string;
  includeDrafts?: boolean;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: { id: string; name: string } | null;
  category: { id: string; name: string; slug: string } | null;
  repos: { owner: string; name: string }[];
  published_at: string | null;
  ai_generated: boolean;
  status: BlogPostStatus;
}

export interface BlogPostDetail extends BlogPostListItem {
  body: string;
  body_html: string;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export async function listPublishedPosts(params: BlogPostListParams = {}): Promise<{ posts: BlogPostListItem[]; pagination: PaginationResult }> {
  const supabase = await supabaseServer();
  if (!supabase) return { posts: [], pagination: { page: params.page ?? 1, limit: Math.min(params.limit ?? 20, 50), total: 0, total_pages: 0 } };
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 50);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("blog_posts")
    .select(`
      id, title, slug, excerpt, published_at, ai_generated, status,
      author:author_id (id),
      category:category_id (id, name, slug)
    `, { count: "exact" })
    .eq("status", params.includeDrafts ? undefined : "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (!params.includeDrafts) {
    query = query.eq("status", "published");
  }

  if (params.category) {
    query = query.eq("category.slug", params.category);
  }

  const { data, error, count } = await query;
  if (error) {
    console.warn("[db] listPublishedPosts:", error);
    return { posts: [], pagination: { page, limit, total: 0, total_pages: 0 } };
  }

  const posts: BlogPostListItem[] = await Promise.all(
    (data || []).map(async (row: any) => {
      const repos = await getReposForPost(row.id);
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        author: row.author ? { id: row.author.id, name: row.author.name ?? "" } : null,
        category: row.category ? { id: row.category.id, name: row.category.name, slug: row.category.slug } : null,
        repos,
        published_at: row.published_at,
        ai_generated: row.ai_generated,
        status: row.status,
      };
    })
  );

  const total = count ?? 0;
  return {
    posts,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

async function getReposForPost(postId: string): Promise<{ owner: string; name: string }[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blog_post_repos")
    .select("repo_owner, repo_name")
    .eq("post_id", postId)
    .order("display_order", { ascending: true });
  return (data || []).map(r => ({ owner: r.repo_owner, name: r.repo_name }));
}

export async function getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id, title, slug, body, excerpt, published_at,
      seo_meta_title, seo_meta_description, ai_generated, status,
      created_at, updated_at,
      author:author_id (id, name),
      category:category_id (id, name, slug)
    `)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;

  const repos = await getReposForPost(data.id);
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    body: data.body,
    body_html: "",
    excerpt: data.excerpt,
    author: (data as any).author ? { id: (data as any).author.id, name: (data as any).author.name ?? "" } : null,
    category: (data as any).category ? { id: (data as any).category.id, name: (data as any).category.name, slug: (data as any).category.slug } : null,
    repos,
    seo_meta_title: data.seo_meta_title,
    seo_meta_description: data.seo_meta_description,
    published_at: data.published_at,
    ai_generated: data.ai_generated,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function getPostById(id: string): Promise<BlogPostDetail | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id, title, slug, body, excerpt, published_at,
      seo_meta_title, seo_meta_description, ai_generated, status,
      created_at, updated_at,
      author:author_id (id, name),
      category:category_id (id, name, slug)
    `)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const repos = await getReposForPost(data.id);
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    body: data.body,
    body_html: "",
    excerpt: data.excerpt,
    author: (data as any).author ? { id: (data as any).author.id, name: (data as any).author.name ?? "" } : null,
    category: (data as any).category ? { id: (data as any).category.id, name: (data as any).category.name, slug: (data as any).category.slug } : null,
    repos,
    seo_meta_title: data.seo_meta_title,
    seo_meta_description: data.seo_meta_description,
    published_at: data.published_at,
    ai_generated: data.ai_generated,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function createPost(data: {
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  author_id: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  category_id?: string | null;
  status?: BlogPostStatus;
  ai_generated?: boolean;
  repos?: { owner: string; name: string }[];
}): Promise<BlogPostRow | null> {
  const supabase = supabaseAdmin();
  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      title: data.title,
      slug: data.slug,
      body: data.body,
      excerpt: data.excerpt ?? null,
      author_id: data.author_id,
      seo_meta_title: data.seo_meta_title ?? null,
      seo_meta_description: data.seo_meta_description ?? null,
      category_id: data.category_id ?? null,
      status: data.status ?? "draft",
      ai_generated: data.ai_generated ?? false,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn("[db] createPost:", error);
    return null;
  }

  if (data.repos && data.repos.length > 0) {
    await setPostRepos(post.id, data.repos);
  }

  return post;
}

export async function updatePost(id: string, data: {
  title?: string;
  slug?: string;
  body?: string;
  excerpt?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  category_id?: string | null;
  status?: BlogPostStatus;
  repos?: { owner: string; name: string }[];
}): Promise<BlogPostRow | null> {
  const supabase = supabaseAdmin();
  const updateData: Record<string, any> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.body !== undefined) updateData.body = data.body;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.seo_meta_title !== undefined) updateData.seo_meta_title = data.seo_meta_title;
  if (data.seo_meta_description !== undefined) updateData.seo_meta_description = data.seo_meta_description;
  if (data.category_id !== undefined) updateData.category_id = data.category_id;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "published") {
      const { data: existing } = await supabase.from("blog_posts").select("published_at").eq("id", id).single();
      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.warn("[db] updatePost:", error);
    return null;
  }

  if (data.repos !== undefined) {
    await setPostRepos(id, data.repos);
  }

  return post;
}

export async function deletePost(id: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) {
    console.warn("[db] deletePost:", error);
    return false;
  }
  return true;
}

export async function getAllPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data || []).map(r => ({ slug: r.slug, updated_at: r.updated_at }));
}

async function setPostRepos(postId: string, repos: { owner: string; name: string }[]): Promise<void> {
  const supabase = supabaseAdmin();
  await supabase.from("blog_post_repos").delete().eq("post_id", postId);
  if (repos.length > 0) {
    const rows = repos.map((r, i) => ({
      post_id: postId,
      repo_owner: r.owner,
      repo_name: r.name,
      display_order: i,
    }));
    await supabase.from("blog_post_repos").insert(rows);
  }
}

export async function getPostAuthorId(postId: string): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("blog_posts")
    .select("author_id")
    .eq("id", postId)
    .single();
  return data?.author_id ?? null;
}
