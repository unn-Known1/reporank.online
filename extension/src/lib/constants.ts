export type ScoreResult = {
  total: number | null
  subscores: Record<string, number> | null
  verdict: string | null
  reviewCount: number
  repoUrl: string
}

export type WatchlistItem = {
  repo_id: string
  repo_name: string
  current_score: number | null
  score_delta: number | null
  last_viewed_at: string
}

export type DashboardData = {
  items: Array<{
    repo_name: string
    repo_url: string
    current_score: number | null
    subscores: Record<string, number> | null
    score_delta: number | null
    last_viewed_at: string
  }>
  total_watched: number
}

export type ExtensionSettings = {
  apiUrl: string
  theme: "system" | "light" | "dark"
  badgeEnabled: boolean
  autoRefresh: boolean
}

export type ExtensionError = {
  type: "NETWORK" | "RATE_LIMITED" | "NOT_FOUND" | "AUTH_REQUIRED" | "UNKNOWN"
  message: string
  retryAfter?: number
}

export type MessageRequest =
  | { type: "FETCH_SCORE"; payload: { platform: string; owner: string; name: string } }
  | { type: "QUEUE_LOOKUP"; payload: { url: string } }
  | { type: "GET_AUTH" }
  | { type: "SIGN_IN" }
  | { type: "SIGN_OUT" }
  | { type: "GET_SETTINGS" }
  | { type: "UPDATE_SETTINGS"; payload: Partial<ExtensionSettings> }
  | { type: "GET_WATCHLIST" }
  | { type: "ADD_TO_WATCHLIST"; payload: { repoId: string } }
  | { type: "REMOVE_FROM_WATCHLIST"; payload: { repoId: string } }
  | { type: "GET_WATCHLIST" }
  | { type: "GET_DASHBOARD" }

export type MessageResponse =
  | { success: true; data?: unknown }
  | { success: false; error: ExtensionError }

export const SCORE_CACHE_TTL = 5 * 60 * 1000
export const RATE_LIMIT_RETRY_DEFAULT = 60
