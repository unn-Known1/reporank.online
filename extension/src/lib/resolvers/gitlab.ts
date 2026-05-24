export type ResolvedRepo = { github_owner: string; github_repo: string } | null

export async function resolveGitLabRepo(projectPath: string): Promise<ResolvedRepo> {
  const apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectPath)}`

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) return null
    const data = await res.json()

    const description: string = data.description ?? ""
    const readmeUrl = data.readme_url ?? ""

    const githubMatch = description.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/)
    if (githubMatch) return { github_owner: githubMatch[1], github_repo: githubMatch[2].replace(/\.git$/, "") }

    const webUrl: string = data.web_url ?? ""
    const name = webUrl.split("/").pop() ?? ""
    const namespace = data.namespace?.path ?? ""

    if (namespace && name) {
      return { github_owner: namespace, github_repo: name }
    }

    return null
  } catch {
    return null
  }
}
