import type { ExtensionSettings } from "./constants"

const SETTINGS_KEY = "reporank_settings"
const RECENT_SEARCHES_KEY = "reporank_recent"
const MAX_RECENT = 10

function getStorage(): chrome.storage.SyncStorageArea | chrome.storage.LocalStorageArea {
  return chrome.storage?.sync ?? chrome.storage?.local
}

function getSessionStorage(): chrome.storage.SessionStorageArea {
  return chrome.storage?.session ?? chrome.storage?.local
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  apiUrl: "https://reporank.online",
  theme: "system",
  badgeEnabled: true,
  autoRefresh: true,
}

export async function getSettings(): Promise<ExtensionSettings> {
  try {
    const res = await getStorage().get(SETTINGS_KEY)
    return { ...DEFAULT_SETTINGS, ...res[SETTINGS_KEY] }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function updateSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings()
  const merged = { ...current, ...partial }
  await getStorage().set({ [SETTINGS_KEY]: merged })
}

export async function getSessionCache<T>(key: string): Promise<T | null> {
  try {
    const res = await getSessionStorage().get(key)
    return res[key] ?? null
  } catch {
    return null
  }
}

export async function setSessionCache<T>(key: string, value: T): Promise<void> {
  try {
    await getSessionStorage().set({ [key]: value })
  } catch {
    // Session storage may not be available in all contexts
  }
}

export async function getRecentSearches(): Promise<string[]> {
  try {
    const res = await getSessionStorage().get(RECENT_SEARCHES_KEY)
    return res[RECENT_SEARCHES_KEY] ?? []
  } catch {
    return []
  }
}

export async function addRecentSearch(query: string): Promise<void> {
  const current = await getRecentSearches()
  const updated = [query, ...current.filter((s) => s !== query)].slice(0, MAX_RECENT)
  try {
    await getSessionStorage().set({ [RECENT_SEARCHES_KEY]: updated })
  } catch {
    // Best-effort
  }
}
