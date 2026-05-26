const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export interface SeoMeta {
  title: string;
  description: string;
  ogImageUrl: string;
}

export function autoGenerateSeoMeta(
  postTitle: string,
  authorName: string,
  slug: string,
  excerpt: string | null,
  body: string,
): SeoMeta {
  const title = `${postTitle} — ${authorName} on RepoRank`;
  const description = excerpt
    ? excerpt.length > 160
      ? excerpt.slice(0, 157) + "..."
      : excerpt
    : stripMarkdown(body).slice(0, 157) + "...";
  const ogImageUrl = `${BASE_URL}/api/og/blog/${slug}`;

  return { title, description, ogImageUrl };
}

export function buildOgImageUrl(slug: string): string {
  return `${BASE_URL}/api/og/blog/${slug}`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*`\[\]()>|~_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeWordCount(body: string): number {
  const text = stripMarkdown(body);
  return text.split(/\s+/).filter(Boolean).length;
}

export function computeReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
