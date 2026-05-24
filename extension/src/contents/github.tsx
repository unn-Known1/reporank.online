import { useState, useEffect, useRef, useCallback } from "react"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { detectRepo } from "../lib/detect"
import { fetchScore, queueLookup } from "../lib/api"
import type { ScoreResult } from "../lib/constants"
import { ScorePanel, ScorePanelLoading } from "../components/ScorePanel"
import { ErrorDisplay } from "../components/ErrorDisplay"

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*/*"],
  run_at: "document_idle",
}

export const getInlineAnchor: PlasmoGetInlineAnchor = () => ({
  element: document.querySelector('[data-turbo-frame="repo-content-turbo-frame"] .Layout-sidebar')
    ?? document.querySelector(".repository-content")
    ?? document.querySelector("#repo-content-pjax-container"),
  insertPosition: "beforebegin",
})

function useCurrentRepo() {
  const [ref, setRef] = useState(() => detectRepo(window.location.href))

  useEffect(() => {
    const handleUrlChange = () => setRef(detectRepo(window.location.href))

    const observer = new MutationObserver(() => {
      const newRef = detectRepo(window.location.href)
      if (newRef && ref && (newRef.owner !== ref.owner || newRef.name !== ref.name)) {
        handleUrlChange()
      }
    })

    observer.observe(document.querySelector("title") ?? document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
    })

    window.addEventListener("popstate", handleUrlChange)
    window.addEventListener("pushstate", handleUrlChange)
    window.addEventListener("replacestate", handleUrlChange)

    const origPushState = history.pushState
    history.pushState = function (...args) {
      origPushState.apply(this, args)
      window.dispatchEvent(new Event("pushstate"))
    }
    const origReplaceState = history.replaceState
    history.replaceState = function (...args) {
      origReplaceState.apply(this, args)
      window.dispatchEvent(new Event("replacestate"))
    }

    return () => {
      observer.disconnect()
      window.removeEventListener("popstate", handleUrlChange)
      window.removeEventListener("pushstate", handleUrlChange)
      window.removeEventListener("replacestate", handleUrlChange)
      history.pushState = origPushState
      history.replaceState = origReplaceState
    }
  }, [ref])

  return ref
}

function QueuedState({ onRetry }: { onRetry: () => void }) {
  const t = { bg: "#ffffff", text: "#24292f", muted: "#57606a", border: "#d0d7de", barBg: "#eaeef2", link: "#0969da" }
  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "12px",
        border: `1px solid ${t.border}`,
        borderRadius: "6px",
        padding: "12px",
        marginBottom: "16px",
        background: t.bg,
        color: t.text,
      }}>
      <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>RepoRank</div>
      <p style={{ margin: "0 0 8px", color: t.muted }}>Lookup queued — check back shortly.</p>
      <button
        onClick={onRetry}
        style={{
          padding: "4px 10px",
          fontSize: "11px",
          border: `1px solid ${t.border}`,
          borderRadius: "4px",
          background: "transparent",
          color: t.link,
          cursor: "pointer",
        }}>
        Retry now
      </button>
    </div>
  )
}

export default function GitHubPanel() {
  const repo = useCurrentRepo()
  const [state, setState] = useState<{ score: ScoreResult | null; loading: boolean; error?: string; queued?: boolean }>({
    score: null,
    loading: true,
  })

  const prevKey = useRef("")

  const loadScore = useCallback(async () => {
    if (!repo) return
    const key = `${repo.owner}/${repo.name}`
    if (key !== prevKey.current) {
      prevKey.current = key
    }
    setState({ score: null, loading: true, queued: false })

    const result = await fetchScore(repo.platform, repo.owner, repo.name)
    if (key !== prevKey.current) return

    if (result.error) {
      setState({ score: null, loading: false, error: result.error.message })
      return
    }
    if (!result.data) {
      await queueLookup(window.location.href)
      if (key === prevKey.current) setState({ score: null, loading: false, queued: true })
      return
    }
    setState({ score: result.data, loading: false })
  }, [repo])

  const handleRetry = useCallback(() => {
    loadScore()
  }, [loadScore])

  useEffect(() => {
    if (!repo) {
      setState({ score: null, loading: false })
      return
    }
    const key = `${repo.owner}/${repo.name}`
    if (key === prevKey.current) return
    prevKey.current = key
    loadScore()
  }, [repo, loadScore])

  useEffect(() => {
    if (!state.queued || !repo) return
    const key = `${repo.owner}/${repo.name}`
    const timer = setTimeout(() => {
      if (key === prevKey.current) loadScore()
    }, 10000)
    return () => clearTimeout(timer)
  }, [state.queued, repo, loadScore])

  if (state.loading) return <ScorePanelLoading />
  if (state.queued) return <QueuedState onRetry={handleRetry} />
  if (state.error) return <ErrorDisplay error={{ type: "UNKNOWN", message: state.error }} />
  if (!state.score) return null

  return <ScorePanel score={state.score} repoUrl={state.score.repoUrl} />
}
