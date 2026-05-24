export type ResolvedRepo = { github_owner: string; github_repo: string } | null

export async function resolveBitbucketRepo(fullPath: string): Promise<ResolvedRepo> {
  const apiUrl = `https://api.bitbucket.org/2.0/repositories/${fullPath}`

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) return null
    const data = await res.json()

    const description: string = data.description ?? ""
    const website: string = data.website ?? ""

    const githubMatch = (description + " " + website).match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/)
    if (githubMatch) return { github_owner: githubMatch[1], github_repo: githubMatch[2].replace(/\.git$/, "") }

    const owner = data.owner?.username ?? fullPath.split("/")[0]
    const name = data.slug ?? fullPath.split("/")[1]
    if (owner && name) {
      return { github_owner: owner, github_repo: name }
    }

    return null
  } catch {
    return null
  }
}
