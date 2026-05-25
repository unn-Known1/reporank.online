import type { ScoreFactors } from "@reporank/core";

// BYOT: Callers now pass user's provider_token when available (see getGitHubToken()).
// The token flows from lookup route → upsertRepoFromGitHub → fetchRepoFactors.

export function detectHasTests(repo: any): boolean {
  const pkg = repo.packageJson?.text;
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg);
      if (parsed.scripts?.test || parsed.scripts?.["test:unit"]) return true;
    } catch {}
  }
  return !!(repo.testsDir?.object || repo.specDir?.object);
}

export function computeReadmeQuality(text: string | null): number {
  if (!text) return 0;
  const length = Math.min(text.length, 5000);
  const sections = (text.match(/^#{1,3}\s+\w/mg) ?? []).length;
  const hasInstall = /\binstall\b/i.test(text);
  const hasUsage = /\busage\b|\busing\b/i.test(text);
  const hasExample = /\bexample\b|\bquick.?start\b/i.test(text);
  return Math.min(
    100,
    Math.round(
      (length / 50) * 0.2 +
        sections * 10 * 0.5 +
        (hasInstall ? 15 : 0) * 0.15 +
        (hasUsage ? 15 : 0) * 0.075 +
        (hasExample ? 15 : 0) * 0.075
    )
  );
}

export function mapRepoDataToFactors(repo: any, openSsfScoreOverride?: number | null): ScoreFactors {
  const lastCommit = repo.defaultBranchRef?.target?.committedDate;
  const prs = (repo.pullRequests?.nodes ?? []).filter(
    (pr: any) => pr.createdAt && pr.mergedAt
  );

  const seenAuthors = new Set<string>();
  for (const commit of repo.defaultBranchRef?.target?.history?.nodes ?? []) {
    if (commit?.author?.user?.login) seenAuthors.add(commit.author.user.login);
  }
  let uniqueContributors = seenAuthors.size;
  if (uniqueContributors === 0) {
    uniqueContributors = repo.mentionableUsers?.totalCount ?? 0;
  }

  const openIssues = repo.issues?.totalCount ?? 0;
  const closedIssues = repo.closedIssues?.totalCount ?? 0;
  const totalIssues = openIssues + closedIssues;

  const releaseCount = (repo.releases?.nodes ?? []).filter(
    (r: { publishedAt: string }) =>
      new Date(r.publishedAt) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  ).length;

  return {
    lastCommitDaysAgo: lastCommit
      ? Math.floor((Date.now() - new Date(lastCommit).getTime()) / 86400000)
      : null,
    commitFrequency6mo: repo.defaultBranchRef?.target?.history?.nodes?.length ?? null,
    contributorCount6mo: uniqueContributors > 0 ? uniqueContributors : null,
    issueCloseRatio: openIssues === 0 && closedIssues === 0 ? null : closedIssues / totalIssues,
    // Set to null — V1 limitation. Real data requires fetching issue comments (first response
    // per issue), which is expensive via GraphQL. Once added, compute average time from issue
    // creation to first non-author comment. Null avoids penalizing small repos with fake estimates.
    avgIssueFirstResponseHours: null,
    prMergeHours:
      prs.length > 0
        ? prs.reduce(
            (sum: number, pr: any) =>
              sum +
              (new Date(pr.mergedAt).getTime() -
                new Date(pr.createdAt).getTime()) /
                3600000,
            0
          ) / prs.length
        : null,
    stars: repo.stargazerCount ?? 0,
    forks: repo.forkCount ?? 0,
    watchers: repo.watchers?.totalCount ?? 0,
    dependentsCount: repo.dependentsCount ?? null,
    hasCI: (repo.workflowsDir?.entries?.length ?? 0) > 0,
    hasTests: detectHasTests(repo),
    hasLicense: !!repo.licenseInfo,
    readmeQualityScore: computeReadmeQuality(repo.readme?.text),
    hasSecurityMd: !!repo.securityMd?.text,
    hasContributing: !!repo.contributingMd?.text,
    releaseFrequencyPerYear: releaseCount,
    openSsfScore: openSsfScoreOverride ?? null,
  };
}

export async function fetchOpenSsfScore(owner: string, name: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.securityscorecards.dev/projects/github.com/${owner}/${name}`,
      { signal: AbortSignal.timeout(5000) },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.score ?? null
  } catch {
    return null
  }
}
