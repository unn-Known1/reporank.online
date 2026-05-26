import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface UserBlogProfile {
  id: string;
  user_id: string;
  bio: string | null;
  display_name: string | null;
  avatar_url: string | null;
  github_url: string | null;
  website_url: string | null;
  created_at: string;
}

export async function getProfileByUserId(userId: string): Promise<UserBlogProfile | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("user_blog_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function upsertProfile(
  userId: string,
  profile: {
    bio?: string;
    display_name?: string;
    avatar_url?: string;
    github_url?: string;
    website_url?: string;
  },
): Promise<UserBlogProfile | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("user_blog_profiles")
    .upsert({ user_id: userId, ...profile })
    .select("*")
    .single();
  if (error) {
    console.warn("[db] upsertProfile:", error);
    return null;
  }
  return data;
}
