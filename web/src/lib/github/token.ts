import { supabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireEnv } from '@/lib/env'

// SECURITY: provider_token is a short-lived OAuth token scoped to this session.
// Never write it to the database. Never log it. Use only for same-request API calls.

export function getAppToken(): string | null {
  try {
    return requireEnv('GITHUB_APP_TOKEN');
  } catch {
    return null;
  }
}

export async function getGitHubToken(): Promise<{ token: string | null; isUserToken: boolean }> {
  try {
    const supabase = await supabaseServer()
    if (!supabase) return { token: null, isUserToken: false }

    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.provider_token) {
        return { token: session.provider_token, isUserToken: true }
      }
    }
  } catch (err) {
    console.error("[token] Failed to get GitHub token:", err)
  }

  try {
    const appToken = requireEnv('GITHUB_APP_TOKEN');
    return { token: appToken, isUserToken: false };
  } catch {
    return { token: null, isUserToken: false };
  }
}

/**
 * Look up a user's GitHub provider_token from the auth.sessions table
 * using the service_role admin client. Used by queue workers where no
 * cookie-based session exists.
 *
 * Returns null if the user has no active session or the lookup fails.
 */
export async function getUserTokenFromSession(userId: string): Promise<string | null> {
  try {
    const { data: token, error } = await supabaseAdmin()
      .rpc('get_user_provider_token', { p_user_id: userId })

    if (error) {
      console.warn('[token] RPC get_user_provider_token failed:', error.message)
      return null
    }

    return token ?? null
  } catch {
    return null
  }
}
