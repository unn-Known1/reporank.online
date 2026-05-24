const SUPABASE_URL = process.env.PLASMO_PUBLIC_SUPABASE_URL ?? ""
const AUTH_CALLBACK_URL = chrome.identity?.getRedirectURL
  ? chrome.identity.getRedirectURL()
  : "https://<extension-id>.chromiumapp.org/"

export type AuthState = {
  signedIn: boolean
  user?: { id: string; email?: string; avatar_url?: string; name?: string }
}

function getIdentityAPI(): typeof chrome.identity | typeof browser.identity | null {
  if (typeof chrome !== "undefined" && chrome.identity) return chrome.identity
  if (typeof browser !== "undefined" && browser.identity) return browser.identity
  return null
}

export async function signIn(): Promise<AuthState> {
  const identity = getIdentityAPI()
  if (!identity) return { signedIn: false }

  try {
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?` +
      `provider=github&` +
      `redirect_to=${encodeURIComponent(AUTH_CALLBACK_URL)}&` +
      `flow_type=pkce`

    const responseUrl = await new Promise<string>((resolve, reject) => {
      identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (callbackUrl) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
        else resolve(callbackUrl)
      })
    })

    const url = new URL(responseUrl)
    const code = url.searchParams.get("code")
    if (!code) return { signedIn: false }

    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      body: JSON.stringify({
        code,
        redirect_uri: AUTH_CALLBACK_URL,
        code_verifier: "",
      }),
    })

    if (!tokenRes.ok) return { signedIn: false }
    const tokenData = await tokenRes.json()

    return {
      signedIn: true,
      user: {
        id: tokenData.user?.id ?? "",
        email: tokenData.user?.email,
        avatar_url: tokenData.user?.user_metadata?.avatar_url,
        name: tokenData.user?.user_metadata?.user_name,
      },
    }
  } catch {
    return { signedIn: false }
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    // Best-effort
  }
}
