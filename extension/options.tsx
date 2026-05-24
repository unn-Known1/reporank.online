import { useState, useEffect } from "react"
import type { ExtensionSettings } from "./lib/constants"

function OptionsPage() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (res) => {
      if (res?.success) setSettings(res.data)
    })
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    chrome.runtime.sendMessage(
      { type: "UPDATE_SETTINGS", payload: settings },
      () => {
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    )
  }

  const update = (partial: Partial<ExtensionSettings>) => {
    if (!settings) return
    setSettings({ ...settings, ...partial })
  }

  const styles = {
    container: {
      maxWidth: "480px",
      margin: "40px auto",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: "0 16px",
    },
    title: { fontSize: "20px", fontWeight: 600, marginBottom: "24px" },
    group: { marginBottom: "20px" },
    label: { display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" },
    input: {
      width: "100%",
      padding: "8px 10px",
      fontSize: "13px",
      border: "1px solid #d0d7de",
      borderRadius: "6px",
      boxSizing: "border-box" as const,
    },
    select: {
      padding: "8px 10px",
      fontSize: "13px",
      border: "1px solid #d0d7de",
      borderRadius: "6px",
      background: "#fff",
    },
    row: { display: "flex", alignItems: "center", gap: "8px" },
    button: {
      padding: "8px 20px",
      fontSize: "13px",
      fontWeight: 500,
      border: "none",
      borderRadius: "6px",
      color: "#fff",
      background: "#0969da",
      cursor: "pointer",
    },
    buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
    saved: { color: "#1a7f37", fontSize: "13px", marginLeft: "12px" },
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>RepoRank Settings</h1>

      <div style={styles.group}>
        <label style={styles.label}>API URL</label>
        <input
          style={styles.input}
          value={settings?.apiUrl ?? ""}
          onChange={(e) => update({ apiUrl: e.target.value })}
          placeholder="https://reporank.online"
        />
      </div>

      <div style={styles.group}>
        <label style={styles.label}>Theme</label>
        <select
          style={styles.select}
          value={settings?.theme ?? "system"}
          onChange={(e) => update({ theme: e.target.value as ExtensionSettings["theme"] })}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div style={styles.group}>
        <div style={styles.row}>
          <input
            type="checkbox"
            id="badge"
            checked={settings?.badgeEnabled ?? true}
            onChange={(e) => update({ badgeEnabled: e.target.checked })}
          />
          <label htmlFor="badge" style={{ fontSize: "13px" }}>
            Show badge with score count
          </label>
        </div>
      </div>

      <div style={styles.group}>
        <div style={styles.row}>
          <input
            type="checkbox"
            id="autorefresh"
            checked={settings?.autoRefresh ?? true}
            onChange={(e) => update({ autoRefresh: e.target.checked })}
          />
          <label htmlFor="autorefresh" style={{ fontSize: "13px" }}>
            Auto-refresh scores
          </label>
        </div>
      </div>

      <div style={styles.row}>
        <button
          style={{ ...styles.button, ...(saving ? styles.buttonDisabled : {}) }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span style={styles.saved}>Settings saved</span>}
      </div>
    </div>
  )
}

export default OptionsPage
