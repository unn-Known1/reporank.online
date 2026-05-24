import { useState } from "react"
import { signIn, signOut } from "../lib/auth"
import type { AuthState } from "../lib/auth"

export function AuthStatus() {
  const [auth, setAuth] = useState<AuthState>({ signedIn: false })
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    const result = await signIn()
    setAuth(result)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setAuth({ signedIn: false })
  }

  if (auth.signedIn && auth.user) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0",
        marginBottom: "8px",
        borderBottom: "1px solid #eaeef2",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {auth.user.avatar_url && (
            <img src={auth.user.avatar_url} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
          )}
          <span style={{ fontSize: "12px", fontWeight: 500 }}>{auth.user.name ?? "User"}</span>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: "11px",
            color: "#57606a",
            border: "none",
            background: "none",
            cursor: "pointer",
          }}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: "8px" }}>
      <button
        onClick={handleSignIn}
        disabled={loading}
        style={{
          width: "100%",
          padding: "6px 12px",
          fontSize: "12px",
          background: loading ? "#eaeef2" : "#0969da",
          color: loading ? "#57606a" : "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "default" : "pointer",
        }}>
        {loading ? "Signing in..." : "Sign in with GitHub"}
      </button>
    </div>
  )
}
