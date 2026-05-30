import type { MessageRequest, MessageResponse, ExtensionSettings } from "../lib/constants"
import { fetchScore, queueLookup, getWatchlist, addToWatchlist, removeFromWatchlist, getDashboard } from "../lib/api"
import { getSettings, updateSettings } from "../lib/storage"
import { registerBadgeAlarm, updateBadge } from "./badge"

async function handleMessage(req: MessageRequest): Promise<MessageResponse> {
  switch (req.type) {
    case "FETCH_SCORE": {
      const { data, error } = await fetchScore(req.payload.platform, req.payload.owner, req.payload.name)
      if (error) return { success: false, error }
      return { success: true, data }
    }

    case "QUEUE_LOOKUP": {
      const { error } = await queueLookup(req.payload.url)
      if (error) return { success: false, error }
      return { success: true }
    }

    case "GET_SETTINGS": {
      const settings = await getSettings()
      return { success: true, data: settings }
    }

    case "UPDATE_SETTINGS": {
      await updateSettings(req.payload)
      return { success: true }
    }

    case "GET_WATCHLIST": {
      const { data, error } = await getWatchlist()
      if (error) return { success: false, error }
      return { success: true, data }
    }

    case "ADD_TO_WATCHLIST": {
      const { error } = await addToWatchlist(req.payload.repoId)
      if (error) return { success: false, error }
      return { success: true }
    }

    case "REMOVE_FROM_WATCHLIST": {
      const { error } = await removeFromWatchlist(req.payload.repoId)
      if (error) return { success: false, error }
      return { success: true }
    }

    case "GET_DASHBOARD": {
      const { data, error } = await getDashboard()
      if (error) return { success: false, error }
      return { success: true, data }
    }

    case "GET_AUTH":
    case "SIGN_IN":
    case "SIGN_OUT":
      return { success: false, error: { type: "UNKNOWN", message: "Not implemented yet" } }

    default:
      return { success: false, error: { type: "UNKNOWN", message: "Unknown message type" } }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  registerBadgeAlarm()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "reporank-badge-update") {
    updateBadge()
  }
})

chrome.runtime.onMessage.addListener(
  (req: MessageRequest, _sender: chrome.runtime.MessageSender, sendResponse: (res: MessageResponse) => void) => {
    handleMessage(req)
      .then(sendResponse)
      .catch(err => {
        console.error("Error in background message handler:", err)
        sendResponse({ success: false, error: { type: "UNKNOWN", message: err?.message || String(err) } })
      })
    return true
  },
)
