import { useState } from "react"
import type { ScoreResult } from "../lib/constants"
import { addRecentSearch } from "../lib/storage"

type Props = {
  onResult: (score: ScoreResult, query: string) => void
}

export function PopupSearch({ onResult }: Props) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScoreResult | null>(null)

  const handleSearch = async () => {
    const trimmed = query.trim()
    if (!trimmed || !trimmed.includes("/")) {
      setError('Enter owner/repo format (e.g. "vercel/next.js")')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    const [owner, ...rest] = trimmed.split("/")
    const name = rest.join("/")

    chrome.runtime.sendMessage(
      { type: "FETCH_SCORE", payload: { platform: "github", owner, name } },
      (res) => {
        setLoading(false)
        if (res?.success) {
          setResult(res.data)
          onResult(res.data, trimmed)
          addRecentSearch(trimmed)
        } else {
          setError(res?.error?.message ?? "Search failed")
        }
      },
    )
  }

  const styles = {
    wrapper: { marginBottom: "8px" },
    inputRow: { display: "flex", gap: "6px" },
    input: {
      flex: 1,
      padding: "6px 8px",
      fontSize: "12px",
      border: "1px solid #d0d7de",
      borderRadius: "4px",
      outline: "none",
    },
    button: {
      padding: "6px 12px",
      fontSize: "12px",
      background: "#0969da",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    },
    error: { color: "#b91c1c", fontSize: "11px", marginTop: "4px" },
    result: { marginTop: "6px", fontSize: "12px", color: "#24292f" },
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="owner/repo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button style={styles.button} onClick={handleSearch} disabled={loading}>
          {loading ? "..." : "Search"}
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {result && (
        <div style={styles.result}>
          Score: <strong>{result.total ?? "?"}</strong>/100 · {result.reviewCount} review{result.reviewCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}
