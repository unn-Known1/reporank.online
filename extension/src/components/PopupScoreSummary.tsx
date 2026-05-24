import type { ScoreResult } from "../lib/constants"

type Props = {
  score: ScoreResult
  repoPath: string
  repoUrl: string
}

export function PopupScoreSummary({ score, repoPath, repoUrl }: Props) {
  const styles = {
    container: {
      padding: "8px 10px",
      borderRadius: "6px",
      border: "1px solid #d0d7de",
      marginBottom: "8px",
      background: "#f6f8fa",
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
    repoName: { fontWeight: 600, fontSize: "12px", color: "#0969da", textDecoration: "none" },
    score: { fontWeight: 700, fontSize: "14px" },
    subscores: { marginTop: "4px" },
    subRow: { display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" },
    subLabel: { width: "80px", fontSize: "10px", color: "#57606a", textTransform: "capitalize" },
    bar: { flex: 1, height: "3px", background: "#eaeef2", borderRadius: "999px", overflow: "hidden" },
    barFill: (val: number) => ({
      width: `${val}%`,
      height: "100%",
      background: val >= 70 ? "#3B6D11" : val >= 40 ? "#854F0B" : "#A32D2D",
      borderRadius: "999px",
    }),
    subVal: { width: "20px", textAlign: "right", fontSize: "10px", color: "#57606a" },
    footer: { marginTop: "6px", fontSize: "10px", color: "#57606a" },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" style={styles.repoName}>
          {repoPath}
        </a>
        <span style={{ ...styles.score, color: score.total != null && score.total >= 70 ? "#3B6D11" : score.total != null && score.total >= 40 ? "#854F0B" : "#A32D2D" }}>
          {score.total ?? "?"}
        </span>
      </div>
      {score.subscores && (
        <div style={styles.subscores}>
          {Object.entries(score.subscores).map(([key, val]) => (
            <div key={key} style={styles.subRow}>
              <span style={styles.subLabel}>{key}</span>
              <div style={styles.bar}>
                <div style={styles.barFill(val)} />
              </div>
              <span style={styles.subVal}>{val}</span>
            </div>
          ))}
        </div>
      )}
      <div style={styles.footer}>{score.reviewCount} review{score.reviewCount !== 1 ? "s" : ""}</div>
    </div>
  )
}
