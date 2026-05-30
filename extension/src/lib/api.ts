import type { ScoreResult, WatchlistItem, DashboardData } from "./constants"
import { getSettings } from "./storage"

export const BASE_URL = process.env.PLASMO_PUBLIC_API_URL ?? "https://reporank.online"

export type ApiError = {
  type: "NETWORK" | "RATE_LIMITED" | "NOT_FOUND" | "AUTH_REQUIRED" | "UNKNOWN"
  message: string
  retryAfter?: number
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const settings = await getSettings().catch(() => ({ apiUrl: BASE_URL }))
    const activeBaseUrl = settings.apiUrl || BASE_URL
    const res = await fetch(`${activeBaseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", ...init?.headers },
    })
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? 60)
      return { error: { type: "RATE_LIMITED", message: `Rate limited. Retry in ${retryAfter}s.`, retryAfter } }
    }
    if (res.status === 404) return { error: { type: "NOT_FOUND", message: "Repository not found in RepoRank cache." } }
    if (res.status === 401) return { error: { type: "AUTH_REQUIRED", message: "Sign in to use this feature." } }
    if (!res.ok) return { error: { type: "UNKNOWN", message: `Unexpected error (${res.status}).` } }
    const data = await res.json()
    return { data }
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { error: { type: "NETWORK", message: "Request timed out after 5s." } }
    }
    return { error: { type: "NETWORK", message: "Unable to reach RepoRank servers. Check your connection." } }
  }
}

export async function fetchScore(platform: string, owner: string, name: string) {
  return request<ScoreResult>(`/api/ext/score?platform=${platform}&owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(name)}`)
}

export async function queueLookup(url: string) {
  return request<{ jobId?: string }>("/api/repo/lookup", {
    method: "POST",
    body: JSON.stringify({ input: url }),
  })
}

export async function pollJob(jobId: string) {
  return request<ScoreResult>(`/api/job/${jobId}`)
}

export async function getWatchlist() {
  return request<{ items: WatchlistItem[] }>("/api/user/watchlist")
}

export async function addToWatchlist(repoId: string) {
  return request<{ status: string }>("/api/user/watchlist", {
    method: "POST",
    body: JSON.stringify({ repo_id: repoId }),
  })
}

export async function removeFromWatchlist(repoId: string) {
  return request<{ status: string }>(`/api/user/watchlist/${repoId}`, { method: "DELETE" })
}

export async function getDashboard() {
  return request<DashboardData>("/api/user/dashboard")
}
