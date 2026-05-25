import { withRetry } from "@/lib/retry";
import { GitHubApiError } from "./errors";

export const VIEWER_REPOS_QUERY = `
query ViewerRepos($first: Int!, $after: String) {
  viewer {
    repositories(
      first: $first
      after: $after
      orderBy: { field: PUSHED_AT, direction: DESC }
      affiliations: [OWNER]
      privacy: PUBLIC
    ) {
      nodes {
        name
        nameWithOwner
        owner { login avatarUrl }
        description
        stargazerCount
        forkCount
        primaryLanguage { name color }
        isArchived
        pushedAt
        url
        repositoryTopics(first: 5) {
          nodes { topic { name } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}
`;

export type GitHubUserRepoNode = {
  name: string;
  nameWithOwner: string;
  owner: { login: string; avatarUrl: string };
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string } | null;
  isArchived: boolean;
  pushedAt: string;
  url: string;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
};

type ViewerReposResponse = {
  data?: {
    viewer?: {
      repositories?: {
        nodes: GitHubUserRepoNode[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };
  };
  errors?: { type?: string; message: string }[];
};

async function fetchViewerReposPage(token: string, first: number, after?: string) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: VIEWER_REPOS_QUERY,
      variables: { first, after },
    }),
  });

  if (res.status === 401) {
    throw new GitHubApiError("GitHub token expired or invalid", 401, { retryable: false });
  }

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
    throw new GitHubApiError("GitHub rate limited", 429, { retryAfterSec: retryAfter });
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub GraphQL failed: ${res.status} ${txt}`);
  }

  return res;
}

// Cap at 5 pages (500 repos) to prevent runaway pagination
const MAX_PAGES = 5;

export async function fetchViewerRepos(token: string): Promise<GitHubUserRepoNode[]> {
  const allRepos: GitHubUserRepoNode[] = [];
  let after: string | undefined;
  let hasNextPage = true;
  let pageCount = 0;

  while (hasNextPage && pageCount < MAX_PAGES) {
    pageCount++;
    const res = await withRetry(() => fetchViewerReposPage(token, 100, after), {
      maxAttempts: 3,
      baseDelayMs: 2000,
    });

    const json: ViewerReposResponse = await res.json();

    if (json.errors?.length) {
      const fatalTypes = new Set(["NOT_FOUND", "FORBIDDEN", "UNAUTHORIZED", "MAX_NODE_LIMIT_EXCEEDED"]);
      const hasFatal = json.errors.some(
        (e: { type?: string }) => e.type && fatalTypes.has(e.type)
      );
      if (hasFatal) {
        throw new GitHubApiError(`GitHub GraphQL failed: ${JSON.stringify(json.errors)}`, 422, { retryable: false });
      }
      console.warn("[RepoRank] GraphQL field-level errors:", JSON.stringify(json.errors));
    }

    const repos = json.data?.viewer?.repositories;
    if (!repos) break;

    allRepos.push(...repos.nodes);
    hasNextPage = repos.pageInfo.hasNextPage;
    after = repos.pageInfo.endCursor ?? undefined;
  }

  return allRepos;
}
