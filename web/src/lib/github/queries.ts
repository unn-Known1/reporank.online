export const REPO_FACTORS_QUERY = `
query RepoFactors($owner: String!, $name: String!, $since6mo: GitTimestamp!) {
  repository(owner: $owner, name: $name) {
    name
    nameWithOwner
    description
    isArchived
    isDisabled
    stargazerCount
    forkCount
    licenseInfo { key }
    watchers { totalCount }
    defaultBranchRef {
      name
      target {
        ... on Commit {
          committedDate
          history(first: 100, since: $since6mo) {
            nodes { oid author { user { login } } }
            totalCount
          }
        }
      }
    }
    issues(states: OPEN) { totalCount }
    closedIssues: issues(states: CLOSED) { totalCount }
    pullRequests(states: MERGED, last: 20) {
      nodes { createdAt mergedAt }
    }
    readme: object(expression: "HEAD:README.md") {
      ... on Blob { text }
    }
    securityMd: object(expression: "HEAD:SECURITY.md") {
      ... on Blob { text }
    }
    contributingMd: object(expression: "HEAD:CONTRIBUTING.md") {
      ... on Blob { text }
    }
    packageJson: object(expression: "HEAD:package.json") {
      ... on Blob { text }
    }
    workflowsDir: object(expression: "HEAD:.github/workflows") {
      ... on Tree { entries { name } }
    }
    releases(last: 50) {
      nodes { publishedAt }
    }
    mentionableUsers { totalCount }
  }
}
`;
// Note: Releases data depends on the `refs` connection which may return
// empty for repos without formal releases. The scoring engine handles null
// releaseFrequencyPerYear gracefully (scores 0 for missing data). For repos
// that use tags instead of releases, consider adding tag-based fallback.