import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createServerClient(url, key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          await Promise.all(
            cookiesToSet.map(async ({ name, value, options }) => {
              try { await cookieStore.set(name, value, options); } catch (err) {
                console.error("[supabase] Failed to set cookie:", err);
              }
            })
          );
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}
