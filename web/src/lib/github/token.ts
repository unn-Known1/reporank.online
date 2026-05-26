import { supabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireEnv } from '@/lib/env'

// SECURITY: provider_token is a short-lived OAuth token scoped to this session.
// Never write it to the database. Never log it. Use only for same-request API calls.

export async function getGitHubToken(): Promise<{ token: string | null; isUserToken: boolean }> {
  try {
    const supabase = await supabaseServer()
    if (!supabase) throw new Error('Supabase not configured')
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.provider_token) {
      return { token: session.provider_token, isUserToken: true }
    }
  } catch {
    // Session fetch failed — fall through to app token
  }

  const appToken = process.env.GITHUB_APP_TOKEN;
  if (!appToken) return { token: null, isUserToken: false };
  return { token: appToken, isUserToken: false };
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
