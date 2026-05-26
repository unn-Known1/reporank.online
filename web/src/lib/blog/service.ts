import {
  listPublishedPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getAllPublishedSlugs,
  getPostAuthorId,
  incrementViewCount,
  getPostsByAuthor,
  BlogPostStatus,
  BlogPostType,
} from "@/lib/db/blog-posts";
import { listCategories, getCategoryById } from "@/lib/db/blog-categories";
import { validateBlogPost, truncateExcerpt, ValidationError } from "@/lib/blog/validation";
import { renderMarkdown } from "@/lib/blog/markdown";
import { generateSlug, isValidSlug } from "@/lib/blog/slug";
import { autoGenerateSeoMeta, computeWordCount, computeReadingTime, formatReadingTime } from "@/lib/blog/seo";
import { checkAllSpamRules, checkWordCountWarning } from "@/lib/blog/spam";
import { validateTags } from "@/lib/blog/tags";
import { getUser } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/db/user-blog-profiles";

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
  type?: BlogPostType;
  tags?: string[];
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
  tags?: string[];
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

  if (input.tags && input.tags.length > 0) {
    const tagResult = validateTags(input.tags);
    if (tagResult.errors.length > 0) {
      return { success: false as const, errors: tagResult.errors.map(e => ({ field: "tags", message: e })) };
    }
    input.tags = tagResult.tags;
  }

  if (input.category_id) {
    const category = await getCategoryById(input.category_id);
    if (!category) {
      return { success: false as const, errors: [{ field: "category_id", message: "Category not found" } as ValidationError] };
    }
  }

  const isUserPost = input.type === "user" || !input.type;

  if (isUserPost) {
    const spamCheck = await checkAllSpamRules(authorId, input.body);
    if (spamCheck) {
      return { success: false as const, errors: [{ field: "spam", message: spamCheck.reason ?? "Post blocked by spam filter" } as ValidationError] };
    }
  }

  const slug = input.slug || generateSlug(input.title);
  if (!isValidSlug(slug)) {
    return { success: false as const, errors: [{ field: "slug", message: "Invalid generated slug" } as ValidationError] };
  }

  let finalSlug = slug;
  const existingSlug = await getPostBySlug(finalSlug);
  if (existingSlug) {
    const base = slug.replace(/-\d+$/, "");
    let attempt = 2;
    while (await getPostBySlug(finalSlug)) {
      finalSlug = `${base}-${attempt}`;
      attempt++;
    }
  }

  const excerpt = input.excerpt || truncateExcerpt(input.body);
  const wordCount = computeWordCount(input.body);

  const postType: BlogPostType = input.type ?? "user";

  let seoMetaTitle = input.seo_meta_title;
  let seoMetaDescription = input.seo_meta_description;

  if (isUserPost) {
    const userProfile = await getProfileByUserId(authorId);
    const authorName = userProfile?.display_name ?? authorId.slice(0, 8);
    const auto = autoGenerateSeoMeta(input.title, authorName, slug, excerpt, input.body);
    if (!seoMetaTitle) seoMetaTitle = auto.title;
    if (!seoMetaDescription) seoMetaDescription = auto.description;
  }

  let post;
  try {
    post = await createPost({
      title: input.title,
      slug: finalSlug,
    body: input.body,
    excerpt,
    author_id: authorId,
    seo_meta_title: seoMetaTitle,
    seo_meta_description: seoMetaDescription,
    category_id: input.category_id,
    status: input.status,
    ai_generated: input.ai_generated ?? false,
    type: postType,
    tags: input.tags ?? [],
    word_count: wordCount,
    repos: input.repos,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "SLUG_CONFLICT") {
      return { success: false as const, errors: [{ field: "slug", message: "Slug already exists after retry — try a different title" } as ValidationError] };
    }
    return { success: false as const, errors: [{ field: "_", message: "Failed to create post" } as ValidationError] };
  }

  if (!post) {
    return { success: false as const, errors: [{ field: "_", message: "Failed to create post" } as ValidationError] };
  }

  return { success: true as const, post: { id: post.id, slug: finalSlug, title: post.title, status: post.status } };
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

  if (input.tags && input.tags.length > 0) {
    const tagResult = validateTags(input.tags);
    if (tagResult.errors.length > 0) {
      return { success: false as const, errors: tagResult.errors.map(e => ({ field: "tags", message: e })) };
    }
    input.tags = tagResult.tags;
  }

  let wordCount: number | undefined;
  if (input.body !== undefined) {
    wordCount = computeWordCount(input.body);
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
    tags: input.tags,
    word_count: wordCount,
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
  type?: BlogPostType;
  author?: string;
  tag?: string;
  sort?: "latest" | "popular";
}) {
  return listPublishedPosts(params);
}

export async function listBlogCategories() {
  return listCategories();
}

export async function getBlogPostSlugs(type?: BlogPostType) {
  return getAllPublishedSlugs(type);
}

export async function checkPostOwnership(postId: string, userId: string): Promise<boolean> {
  const authorId = await getPostAuthorId(postId);
  return authorId === userId;
}

export async function trackPostView(postId: string): Promise<void> {
  await incrementViewCount(postId);
}

export { checkWordCountWarning } from "@/lib/blog/spam";

export function getReadingTime(wordCount: number): string {
  return formatReadingTime(computeReadingTime(wordCount));
}
