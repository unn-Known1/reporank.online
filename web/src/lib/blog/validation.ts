export interface ValidationError {
  field: string;
  message: string;
}

export interface BlogPostInput {
  title: string;
  body: string;
  excerpt?: string;
  slug?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  status?: string;
  category_id?: string | null;
  repos?: { owner: string; name: string }[];
}

export function validateBlogPost(input: BlogPostInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (input.title.length > 200) {
    errors.push({ field: "title", message: "Title too long (max 200 characters)" });
  }

  if (!input.body || input.body.trim().length === 0) {
    errors.push({ field: "body", message: "Body is required" });
  } else if (input.body.length > 100000) {
    errors.push({ field: "body", message: "Body too long (max 100000 characters)" });
  }

  if (input.excerpt && input.excerpt.length > 500) {
    errors.push({ field: "excerpt", message: "Excerpt too long (max 500 characters)" });
  }

  if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    errors.push({ field: "slug", message: "Invalid slug format" });
  }

  if (input.seo_meta_title && input.seo_meta_title.length > 70) {
    errors.push({ field: "seo_meta_title", message: "Meta title too long (max 70 characters)" });
  }

  if (input.seo_meta_description && input.seo_meta_description.length > 160) {
    errors.push({ field: "seo_meta_description", message: "Meta description too long (max 160 characters)" });
  }

  if (input.status && !["draft", "published"].includes(input.status)) {
    errors.push({ field: "status", message: "Invalid status (must be 'draft' or 'published')" });
  }

  if (input.repos) {
    for (let i = 0; i < input.repos.length; i++) {
      const repo = input.repos[i];
      if (!repo.owner || !repo.owner.trim()) {
        errors.push({ field: `repos[${i}].owner`, message: "Repository owner is required" });
      }
      if (!repo.name || !repo.name.trim()) {
        errors.push({ field: `repos[${i}].name`, message: "Repository name is required" });
      }
    }
  }

  return errors;
}

export function truncateExcerpt(body: string, maxLength = 150): string {
  const stripped = body.replace(/[#*`\[\]()>|~_]/g, "").trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}
