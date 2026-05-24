const BADGE_ALARM_NAME = "reporank-badge-update"
const BADGE_UPDATE_INTERVAL_MINUTES = 1

export function registerBadgeAlarm(): void {
  chrome.alarms.create(BADGE_ALARM_NAME, { periodInMinutes: BADGE_UPDATE_INTERVAL_MINUTES })
}

export async function updateBadge(): Promise<void> {
  try {
    const res = await fetch("/api/user/dashboard", { credentials: "include" })
    if (!res.ok) {
      chrome.action.setBadgeText({ text: "" })
      return
    }
    const data = await res.json()
    const count = data?.total_watched ?? 0
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(count) })
      chrome.action.setBadgeBackgroundColor({ color: "#0969da" })
    } else {
      chrome.action.setBadgeText({ text: "" })
    }
  } catch {
    chrome.action.setBadgeText({ text: "" })
  }
}
