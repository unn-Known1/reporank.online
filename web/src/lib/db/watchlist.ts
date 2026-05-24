import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function addToWatchlist(userId: string, repoId: string) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("watchlist_items")
    .insert({ user_id: userId, repo_id: repoId })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Already watching this repo" };
    }
    console.warn("[db] addToWatchlist:", error);
    return { error: "Failed to add to watchlist" };
  }
  return { data };
}

export async function removeFromWatchlist(userId: string, repoId: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("repo_id", repoId);

  if (error) {
    console.warn("[db] removeFromWatchlist:", error);
    return { error: "Failed to remove from watchlist" };
  }
  return { success: true };
}

export async function getWatchlist(userId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*, repos(*)")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    console.warn("[db] getWatchlist:", error);
    return [];
  }
  return data ?? [];
}

export async function getWatchlistItem(userId: string, repoId: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", userId)
    .eq("repo_id", repoId)
    .maybeSingle();

  if (error) {
    console.warn("[db] getWatchlistItem:", error);
    return null;
  }
  return data ?? null;
}

export async function updateLastViewed(userId: string, repoId: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("watchlist_items")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("repo_id", repoId);

  if (error) {
    console.warn("[db] updateLastViewed:", error);
  }
}
