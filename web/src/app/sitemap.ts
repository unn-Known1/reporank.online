import { getRecentRepos, getRecentReposCount } from "@/lib/db/repos";
import type { MetadataRoute } from "next";

const SITEMAP_SIZE = 5000;

export async function generateSitemaps() {
  const total = await getRecentReposCount();
  const count = Math.max(1, Math.ceil(total / SITEMAP_SIZE));
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";
  const offset = id * SITEMAP_SIZE;
  const repos = await getRecentRepos(SITEMAP_SIZE, offset);

  const repoUrls = repos
    .filter((r) => r.last_fetched_at)
    .map((repo) => ({
      url: `${base}/github/${repo.owner}/${repo.name}`,
      lastModified: new Date(repo.last_fetched_at!),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  if (id === 0) {
    return [
      { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
      { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      ...repoUrls,
    ];
  }

  return repoUrls;
}
