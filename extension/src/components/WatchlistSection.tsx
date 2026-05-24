import type { WatchlistItem } from "../lib/constants"

type Props = {
  items: WatchlistItem[]
  onClickItem?: (item: WatchlistItem) => void
}

export function WatchlistSection({ items, onClickItem }: Props) {
  if (items.length === 0) return null

  const styles = {
    section: { marginBottom: "4px" },
    label: { fontSize: "10px", fontWeight: 600, color: "#57606a", textTransform: "uppercase", marginBottom: "4px" },
    list: { listStyle: "none", padding: 0, margin: 0 },
    item: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 0",
      fontSize: "12px",
      borderBottom: "1px solid #f0f0f0",
      cursor: "pointer",
    },
    name: { color: "#0969da", cursor: "pointer" },
    score: { fontWeight: 600 },
    delta: (val: number | null) => ({
      fontSize: "11px",
      color: val == null ? "#57606a" : val > 0 ? "#3B6D11" : val < 0 ? "#A32D2D" : "#57606a",
    }),
  }

  return (
    <div style={styles.section}>
      <div style={styles.label}>Watchlist</div>
      <ul style={styles.list}>
        {items.map((item) => (
          <li key={item.repo_id} style={styles.item} onClick={() => onClickItem?.(item)}>
            <span style={styles.name}>{item.repo_name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={styles.score}>{item.current_score ?? "?"}</span>
              <span style={styles.delta(item.score_delta)}>
                {item.score_delta == null ? "–" : item.score_delta > 0 ? `+${item.score_delta}` : `${item.score_delta}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
