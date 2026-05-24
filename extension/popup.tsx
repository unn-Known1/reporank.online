import { useState, useEffect } from "react"
import { PopupSearch } from "./components/PopupSearch"
import { PopupScoreSummary } from "./components/PopupScoreSummary"
import { RecentSearches } from "./components/RecentSearches"
import { AuthStatus } from "./components/AuthStatus"
import { WatchlistSection } from "./components/WatchlistSection"
import type { ScoreResult, WatchlistItem } from "./lib/constants"
import type { RepoRef } from "./lib/detect"
import { detectRepo, formatRepoPath } from "./lib/detect"
import { getRecentSearches } from "./lib/storage"

function IndexPopup() {
  const [currentPage, setCurrentPage] = useState<RepoRef>(null)
  const [pageScore, setPageScore] = useState<ScoreResult | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])

  useEffect(() => {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.url) {
        const ref = detectRepo(tab.url)
        setCurrentPage(ref)
        if (ref) {
          chrome.runtime.sendMessage(
            { type: "FETCH_SCORE", payload: { platform: ref.platform, owner: ref.owner, name: ref.name } },
            (res) => {
              if (res?.success) setPageScore(res.data)
            },
          )
        }
      }
      getRecentSearches().then(setRecentSearches)
      chrome.runtime.sendMessage({ type: "GET_WATCHLIST" }, (res) => {
        if (res?.success && Array.isArray(res.data)) setWatchlist(res.data)
      })
    })()
  }, [])

  const handleSearchResult = (score: ScoreResult, query: string) => {
    setPageScore(score)
    setRecentSearches((prev) => [query, ...prev.filter((s) => s !== query)].slice(0, 10))
  }

  const styles = {
    container: {
      width: "320px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: "13px",
      color: "#24292f",
      background: "#ffffff",
    },
    header: {
      padding: "12px 12px 0",
      fontSize: "14px",
      fontWeight: 600,
      borderBottom: "1px solid #eaeef2",
      paddingBottom: "8px",
      marginBottom: "8px",
    },
    content: { padding: "0 12px 12px" },
    divider: { height: "1px", background: "#eaeef2", margin: "8px 0" },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>RepoRank</span>
      </div>
      <div style={styles.content}>
        <AuthStatus />
        {currentPage && pageScore && (
          <>
            <PopupScoreSummary
              score={pageScore}
              repoPath={formatRepoPath(currentPage)}
              repoUrl={pageScore.repoUrl}
            />
          </>
        )}
        <PopupSearch onResult={handleSearchResult} />
        <div style={styles.divider} />
        <RecentSearches searches={recentSearches} onSearch={(term) => handleSearchResult(pageScore!, term)} />
        <div style={styles.divider} />
        <WatchlistSection items={watchlist} onClickItem={(item) => chrome.tabs.create({ url: `https://reporank.online/github/${item.repo_name}` })} />
      </div>
    </div>
  )
}

export default IndexPopup
