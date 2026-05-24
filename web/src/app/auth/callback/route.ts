import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

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
