import { withRetry } from "@/lib/retry";
import { GitHubApiError } from "./errors";

export type GitHubSearchRepo = {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  avatarUrl: string;
};

export async function searchRepos(query: string, token: string, limit = 8): Promise<GitHubSearchRepo[]> {
  return withRetry(async () => {
    const q = `${encodeURIComponent(query)}+archived:false`;
    const url = `https://api.github.com/search/repositories?q=${q}&per_page=${limit}&sort=stars&order=desc`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
      throw new GitHubApiError("GitHub search rate limited", 429, { retryAfterSec: retryAfter });
    }

    if (!res.ok) {
      throw new GitHubApiError(`GitHub search failed: ${res.status}`, res.status, { retryable: false });
    }

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Invalid JSON response from GitHub search API`);
    }
    if (!json.items || !Array.isArray(json.items)) return [];

    return json.items.map((item: any) => ({
      owner: item.owner?.login ?? "",
      name: item.name,
      fullName: item.full_name,
      description: item.description,
      stars: item.stargazers_count,
      language: item.language,
      topics: item.topics ?? [],
      avatarUrl: item.owner?.avatar_url ?? "",
    }));
  }, { maxAttempts: 2, baseDelayMs: 1000 });
}
