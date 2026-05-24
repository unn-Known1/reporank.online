export type RepoRef = { platform: "github" | "gitlab" | "npm" | "bitbucket" | "codeberg"; owner: string; name: string } | null

export function detectRepo(url: string): RepoRef {
  const github = url.match(/github\.com\/([^/]+)\/([^/?#]+)/)
  if (github) return { platform: "github", owner: github[1], name: github[2].replace(/\.git$/, "") }

  const gitlab = url.match(/gitlab\.com\/([^/]+?)(?:\/([^/?#]+))?\/([^/?#]+)/)
  if (gitlab) {
    const owner = gitlab[1] + (gitlab[2] ? "/" + gitlab[2] : "")
    return { platform: "gitlab", owner, name: gitlab[3].replace(/\.git$/, "") }
  }

  const npm = url.match(/npmjs\.com\/package\/(@[^/]+\/[^/?#]+|[^/?#]+)/)
  if (npm) return { platform: "npm", owner: "", name: npm[1] }

  const bitbucket = url.match(/bitbucket\.org\/([^/]+)\/([^/?#]+)/)
  if (bitbucket) return { platform: "bitbucket", owner: bitbucket[1], name: bitbucket[2].replace(/\.git$/, "") }

  const codeberg = url.match(/codeberg\.org\/([^/]+)\/([^/?#]+)/)
  if (codeberg) return { platform: "codeberg", owner: codeberg[1], name: codeberg[2].replace(/\.git$/, "") }

  return null
}

export function formatRepoPath(ref: NonNullable<RepoRef>): string {
  if (ref.platform === "npm") return ref.name
  return `${ref.owner}/${ref.name}`
}
