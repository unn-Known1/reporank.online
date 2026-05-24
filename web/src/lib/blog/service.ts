import {
  listPublishedPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getAllPublishedSlugs,
  getPostAuthorId,
  BlogPostStatus,
} from "@/lib/db/blog-posts";
import { listCategories, getCategoryById, getCategoryBySlug } from "@/lib/db/blog-categories";
import { getReposByPostId, setReposForPost } from "@/lib/db/blog-repos";
import { generateSlug, isValidSlug } from "@/lib/blog/slug";
import { validateBlogPost, truncateExcerpt, ValidationError } from "@/lib/blog/validation";
import { renderMarkdown } from "@/lib/blog/markdown";
import { getUser } from "@/lib/supabase/server";

export interface CreatePostInput {
  title: string;
  body: string;
  excerpt?: string;
  slug?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  category_id?: string | null;
  status?: BlogPostStatus;
  ai_generated?: boolean;
  repos?: { owner: string; name: string }[];
}

export interface UpdatePostInput {
  title?: string;
  body?: string;
  excerpt?: string;
  slug?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  category_id?: string | null;
  status?: BlogPostStatus;
  repos?: { owner: string; name: string }[];
}

export async function createBlogPost(input: CreatePostInput, authorId: string) {
  const errors = validateBlogPost({
    title: input.title,
    body: input.body,
    excerpt: input.excerpt,
    slug: input.slug,
    seo_meta_title: input.seo_meta_title,
    seo_meta_description: input.seo_meta_description,
    status: input.status,
    category_id: input.category_id,
    repos: input.repos,
  });

  if (errors.length > 0) {
    return { success: false as const, errors };
  }

  if (input.category_id) {
    const category = await getCategoryById(input.category_id);
    if (!category) {
      return { success: false as const, errors: [{ field: "category_id", message: "Category not found" } as ValidationError] };
    }
  }

  const slug = input.slug || generateSlug(input.title);
  if (!isValidSlug(slug)) {
    return { success: false as const, errors: [{ field: "slug", message: "Invalid generated slug" } as ValidationError] };
  }

  const excerpt = input.excerpt || truncateExcerpt(input.body);

  const post = await createPost({
    title: input.title,
    slug,
    body: input.body,
    excerpt,
    author_id: authorId,
    seo_meta_title: input.seo_meta_title,
    seo_meta_description: input.seo_meta_description,
    category_id: input.category_id,
    status: input.status,
    ai_generated: input.ai_generated,
    repos: input.repos,
  });

  if (!post) {
    return { success: false as const, errors: [{ field: "_", message: "Failed to create post" } as ValidationError] };
  }

  return { success: true as const, post: { id: post.id, slug: post.slug, title: post.title, status: post.status } };
}

export async function updateBlogPost(id: string, input: UpdatePostInput) {
  const errors = validateBlogPost({
    title: input.title || "",
    body: input.body || "",
    excerpt: input.excerpt,
    slug: input.slug,
    seo_meta_title: input.seo_meta_title,
    seo_meta_description: input.seo_meta_description,
    status: input.status,
    repos: input.repos,
  });

  if (errors.length > 0) {
    return { success: false as const, errors };
  }

  const post = await updatePost(id, {
    title: input.title,
    slug: input.slug,
    body: input.body,
    excerpt: input.excerpt,
    seo_meta_title: input.seo_meta_title,
    seo_meta_description: input.seo_meta_description,
    category_id: input.category_id,
    status: input.status,
    repos: input.repos,
  });

  if (!post) {
    return { success: false as const, errors: [{ field: "_", message: "Failed to update post" } as ValidationError] };
  }

  return { success: true as const, post: { id: post.id, slug: post.slug, title: post.title, status: post.status } };
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  return deletePost(id);
}

export async function getBlogPostBySlug(slug: string) {
  const post = await getPostBySlug(slug);
  if (!post) return null;

  post.body_html = await renderMarkdown(post.body);

  return post;
}

export async function getBlogPostById(id: string) {
  const post = await getPostById(id);
  if (!post) return null;

  post.body_html = await renderMarkdown(post.body);

  return post;
}

export async function listBlogPosts(params: {
  page?: number;
  limit?: number;
  category?: string;
  includeDrafts?: boolean;
}) {
  return listPublishedPosts(params);
}

export async function listBlogCategories() {
  return listCategories();
}

export async function getBlogPostSlugs() {
  return getAllPublishedSlugs();
}

export async function checkPostOwnership(postId: string, userId: string): Promise<boolean> {
  const authorId = await getPostAuthorId(postId);
  return authorId === userId;
}
