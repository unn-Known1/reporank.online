import { supabaseServer } from '@/lib/supabase/server'
import { requireEnv } from '@/lib/env'

// SECURITY: provider_token is a short-lived OAuth token scoped to this session.
// Never write it to the database. Never log it. Use only for same-request API calls.

export async function getGitHubToken(): Promise<{ token: string; isUserToken: boolean }> {
  try {
    const supabase = await supabaseServer()
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.provider_token) {
      return { token: session.provider_token, isUserToken: true }
    }
  } catch {
    // Session fetch failed — fall through to app token
  }

  return { token: requireEnv('GITHUB_APP_TOKEN'), isUserToken: false }
}
