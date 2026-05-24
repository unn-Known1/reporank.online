import { useState, useEffect } from "react"
import type { ScoreResult } from "../lib/constants"
import { getPageTheme } from "../lib/theme"

const isDark = () => getPageTheme() === "dark"

const THEME = {
  light: {
    bg: "#ffffff",
    text: "#24292f",
    muted: "#57606a",
    border: "#d0d7de",
    barBg: "#eaeef2",
    link: "#0969da",
  },
  dark: {
    bg: "#161b22",
    text: "#e6edf3",
    muted: "#8b949e",
    border: "#30363d",
    barBg: "#21262d",
    link: "#58a6ff",
  },
}

function getTheme() {
  return isDark() ? THEME.dark : THEME.light
}

const VERDICT_COLOR: Record<string, [string, string]> = {
  RECOMMENDED: ["#3B6D11", "#EAF3DE"],
  CAUTION: ["#854F0B", "#FAEEDA"],
  NOT_RECOMMENDED: ["#A32D2D", "#FCEBEB"],
  healthy: ["#3B6D11", "#EAF3DE"],
  warning: ["#854F0B", "#FAEEDA"],
  critical: ["#A32D2D", "#FCEBEB"],
  unknown: ["#5F5E5A", "#F1EFE8"],
}

function getVerdictColors(verdict: string | null): [string, string] {
  const v = verdict ?? "unknown"
  return VERDICT_COLOR[v] ?? VERDICT_COLOR.unknown
}

type BarProps = { label: string; value: number; t: typeof THEME.light }

function SubscoreBar({ label, value, t }: BarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
      <span style={{ width: "90px", fontSize: "11px", color: t.muted, textTransform: "capitalize" }}>{label}</span>
      <div style={{ flex: 1, height: "4px", background: t.barBg, borderRadius: "999px", overflow: "hidden" }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          background: value >= 70 ? "#3B6D11" : value >= 40 ? "#854F0B" : "#A32D2D",
          borderRadius: "999px",
        }} />
      </div>
      <span style={{ width: "24px", textAlign: "right", fontSize: "11px", color: t.muted }}>{value}</span>
    </div>
  )
}

export function ScorePanel({ score, repoUrl }: { score: ScoreResult; repoUrl: string }) {
  const [theme, setTheme] = useState(getTheme)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => setTheme(getTheme())
    mq.addEventListener("change", handler)
    const observer = new MutationObserver(() => setTheme(getTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-color-mode"] })
    return () => {
      mq.removeEventListener("change", handler)
      observer.disconnect()
    }
  }, [])

  const t = theme
  const [fg, bg] = getVerdictColors(score.verdict)

  return (
    <div
      data-testid="reporank-panel"
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontWeight: 600, fontSize: "13px" }}>RepoRank</span>
        <span
          data-testid="panel-score"
          style={{
            background: bg,
            color: fg,
            fontWeight: 600,
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "999px",
          }}>
          {score.total ?? "?"}/100 · {score.verdict ?? "pending"}
        </span>
      </div>

      {score.subscores && Object.entries(score.subscores).map(([key, val]) => (
        <SubscoreBar key={key} label={key} value={val} t={t} />
      ))}

      <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: t.muted, fontSize: "11px" }}>
          {score.reviewCount} review{score.reviewCount !== 1 ? "s" : ""}
        </span>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: t.link, textDecoration: "none", fontSize: "11px" }}>
          View full report →
        </a>
      </div>
    </div>
  )
}

export function ScorePanelLoading() {
  const t = getTheme()
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
        color: t.muted,
      }}>
      <span>Loading RepoRank score...</span>
    </div>
  )
}
