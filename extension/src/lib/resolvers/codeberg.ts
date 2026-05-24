export type ResolvedRepo = { github_owner: string; github_repo: string } | null

export async function resolveCodebergRepo(fullPath: string): Promise<ResolvedRepo> {
  const apiUrl = `https://codeberg.org/api/v1/repos/${fullPath}`

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) return null
    const data = await res.json()

    const description: string = data.description ?? ""

    const githubMatch = description.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/)
    if (githubMatch) return { github_owner: githubMatch[1], github_repo: githubMatch[2].replace(/\.git$/, "") }

    const cloneUrl: string = data.clone_url ?? ""
    const mirrorMatch = cloneUrl.match(/github\.com\/([^/]+)\/([^/.?#]+)/)
    if (mirrorMatch) return { github_owner: mirrorMatch[1], github_repo: mirrorMatch[2].replace(/\.git$/, "") }

    return { github_owner: data.owner?.login ?? fullPath.split("/")[0], github_repo: data.name ?? fullPath.split("/")[1] }
  } catch {
    return null
  }
}
