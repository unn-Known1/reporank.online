export type ResolvedRepo = { github_owner: string; github_repo: string } | null

export async function resolveNpmPackage(packageName: string): Promise<ResolvedRepo> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName).replace(/%2F/g, "/")}`)
    if (!res.ok) return null
    const data = await res.json()

    const latest = data.versions?.[data["dist-tags"]?.latest]
    const repoField = latest?.repository ?? data.repository ?? data?.repository

    if (!repoField) return null

    if (typeof repoField === "string") {
      const match = repoField.match(/github\.com\/([^/]+)\/([^/.?#]+)/)
      if (match) return { github_owner: match[1], github_repo: match[2] }

      const shorthand = repoField.match(/^([\w.-]+)\/([\w.-]+)$/)
      if (shorthand) return { github_owner: shorthand[1], github_repo: shorthand[2] }

      return null
    }

    const url: string = repoField.url ?? ""
    const match = url.match(/github\.com\/([^/]+)\/([^/.?#]+)/)
    if (match) {
      const repo = match[2].replace(/\.git$/, "")
      return { github_owner: match[1], github_repo: repo }
    }

    return null
  } catch {
    return null
  }
}
