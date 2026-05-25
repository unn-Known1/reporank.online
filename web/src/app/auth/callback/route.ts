import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

// CSRF protection is handled by Supabase's PKCE flow:
// createBrowserClient() generates a random code_verifier (stored in
// browser storage) and sends its SHA-256 hash as code_challenge during
// signInWithOAuth. exchangeCodeForSession(code) requires the verifier,
// so an attacker with a forged redirect URL cannot complete the exchange.
// The auth_origin cookie below is for post-auth redirect UX only.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const cookieStore = await cookies();
      const authOrigin = cookieStore.get("auth_origin")?.value;
      const origin = authOrigin ?? new URL(req.url).origin;
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.delete("auth_origin");
      return res;
    }
  }

  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
