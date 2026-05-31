import { REPO_FACTORS_QUERY } from "./queries";
import { withRetry } from "@/lib/retry";
import { GitHubApiError } from "./errors";

async function fetchGraphQL(owner: string, name: string, token: string) {
  const since6mo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: REPO_FACTORS_QUERY,
      variables: { owner, name, since6mo },
    }),
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
    throw new GitHubApiError("GitHub rate limited", 429, { retryAfterSec: retryAfter });
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub GraphQL failed: ${res.status} ${txt}`);
  }

  // Attach rate limit metadata to response for upstream logging
  const rateLimitRemaining = parseInt(res.headers.get("x-ratelimit-remaining") ?? "5000", 10);
  const rateLimitReset = parseInt(res.headers.get("x-ratelimit-reset") ?? "0", 10);
  (res as any).__rateLimit = { remaining: rateLimitRemaining, resetAt: rateLimitReset };

  return res;
}

export async function fetchRepoFactors(owner: string, name: string, token: string) {
  const res = await withRetry(() => fetchGraphQL(owner, name, token), {
    maxAttempts: 3,
    baseDelayMs: 2000,
  });

  const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

  const text = await res.text();
  if (text.length > MAX_RESPONSE_SIZE) {
    throw new Error(
      `GitHub GraphQL response too large: ${text.length} bytes`
    );
  }

  const rateLimit = (res as any).__rateLimit;
  if (rateLimit) {
    console.log(
      `[github] GraphQL fetch for ${owner}/${name}: quota remaining=${rateLimit.remaining}, resetAt=${rateLimit.resetAt}`
    );
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch (parseErr) {
    console.error(`[github] Failed to parse GraphQL response for ${owner}/${name}:`, parseErr);
    throw new Error(`Invalid response from GitHub GraphQL API for ${owner}/${name}`);
  }

  if (json.errors?.length) {
    const fatalTypes = new Set(["NOT_FOUND", "FORBIDDEN", "UNAUTHORIZED", "MAX_NODE_LIMIT_EXCEEDED"]);
    const hasFatal = json.errors.some(
      (e: { type?: string }) => e.type && fatalTypes.has(e.type)
    );
    const hasData = json.data?.repository != null;

    if (hasFatal || !hasData) {
      throw new GitHubApiError(`GitHub GraphQL failed: ${JSON.stringify(json.errors)}`, 422, { retryable: false });
    }

    console.warn(
      `[RepoRank] GraphQL field-level errors for ${owner}/${name}:`,
      JSON.stringify(json.errors)
    );
  }

  const repo = json.data.repository;
  // Estimate dependents from stargazer count when dependency graph is unavailable
  const estimatedDependents = repo.stargazerCount > 1000
    ? Math.round(repo.stargazerCount * 0.02)
    : repo.stargazerCount > 100
      ? Math.round(repo.stargazerCount * 0.01)
      : 0;
  return { ...repo, dependentsCount: estimatedDependents };
}