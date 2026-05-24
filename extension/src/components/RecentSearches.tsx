type Props = {
  searches: string[]
  onSearch?: (term: string) => void
}

export function RecentSearches({ searches, onSearch }: Props) {
  if (searches.length === 0) return null

  const styles = {
    section: { marginBottom: "4px" },
    label: { fontSize: "10px", fontWeight: 600, color: "#57606a", textTransform: "uppercase", marginBottom: "4px" },
    list: { listStyle: "none", padding: 0, margin: 0 },
    item: {
      padding: "4px 0",
      fontSize: "12px",
      color: "#0969da",
      cursor: "pointer",
    },
  }

  return (
    <div style={styles.section}>
      <div style={styles.label}>Recent</div>
      <ul style={styles.list}>
        {searches.map((s) => (
          <li key={s} style={styles.item} onClick={() => onSearch?.(s)}>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
