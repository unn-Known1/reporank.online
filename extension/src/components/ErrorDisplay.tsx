import type { ExtensionError } from "../lib/constants"

const ERROR_MESSAGES: Record<ExtensionError["type"], string> = {
  NETWORK: "Unable to reach RepoRank servers. Check your connection.",
  RATE_LIMITED: "Rate limit reached. Please try again later.",
  NOT_FOUND: "This repository hasn't been scored yet. Lookup queued.",
  AUTH_REQUIRED: "Sign in to use this feature.",
  UNKNOWN: "Something went wrong. Please try again.",
}

type Props = {
  error: ExtensionError
  onRetry?: () => void
  compact?: boolean
}

export function ErrorDisplay({ error, onRetry, compact }: Props) {
  const message = error.type === "RATE_LIMITED" && error.retryAfter
    ? `Rate limit reached. Try again in ${error.retryAfter} seconds.`
    : ERROR_MESSAGES[error.type]

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: compact ? "8px" : "12px",
      borderRadius: "6px",
      border: "1px solid #f0c6c6",
      background: "#fef2f2",
      color: "#b91c1c",
      fontSize: compact ? "11px" : "12px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      marginBottom: "8px",
    },
    message: { margin: 0, lineHeight: 1.4 },
    retry: {
      marginTop: "6px",
      padding: "4px 10px",
      fontSize: "11px",
      border: "1px solid #f0c6c6",
      borderRadius: "4px",
      background: "transparent",
      color: "#b91c1c",
      cursor: "pointer",
    },
  }

  return (
    <div style={styles.container} role="alert">
      <p style={styles.message}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={styles.retry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function ErrorDisplayLoading() {
  return null
}
