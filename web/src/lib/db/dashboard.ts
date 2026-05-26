import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWatchlist, updateLastViewed } from "./watchlist";
import type { DashboardItem } from "./db-schema";

export async function getDashboardData(userId: string): Promise<{
  items: DashboardItem[];
  total: number;
}> {
  const watchlist = await getWatchlist(userId);
  if (watchlist.length === 0) {
    return { items: [], total: 0 };
  }

  const supabase = await supabaseServer();
  if (!supabase) return { items: [], total: 0 };
  const repoIds = watchlist.map((w) => w.repo_id);

  // Batch-fetch latest scores for all watched repos in one query
  const latestScores = await getLatestScoresForRepos(supabase, repoIds);

  // Batch-fetch scores before last_viewed_at for all repos in one query
  const cutoffScores = await getScoresBeforeTimestamps(supabase, watchlist);

  const items: DashboardItem[] = [];

  for (const item of watchlist) {
    const repo = item.repos as any;
    if (!repo) continue;

    const latestScore = latestScores.get(item.repo_id) ?? null;
    let delta: number | null = null;
    let direction: "up" | "down" | "flat" | null = null;

    if (latestScore !== null && item.last_viewed_at) {
      const scoreAtLastView = cutoffScores.get(item.repo_id) ?? null;
      if (scoreAtLastView !== null) {
        delta = latestScore - scoreAtLastView;
        direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      }
    }

    items.push({
      id: item.id,
      repo_id: item.repo_id,
      owner: repo.owner,
      name: repo.name,
      full_name: repo.full_name,
      language: repo.language,
      stars: repo.stars,
      total_score: latestScore,
      score_delta: delta,
      delta_direction: direction,
      added_at: item.added_at,
      last_viewed_at: item.last_viewed_at,
    });
  }

  // Batch-update last_viewed_at for all watched repos
  const supabaseAdminClient = supabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabaseAdminClient
    .from("watchlist_items")
    .update({ last_viewed_at: now })
    .in("id", watchlist.map((w) => w.id));
  if (error) console.warn("[db] updateLastViewed:", error);

  return { items, total: items.length };
}

async function getLatestScoresForRepos(supabase: any, repoIds: string[]): Promise<Map<string, number>> {
  // Fetch all recent scores for these repos, then deduplicate to keep latest per repo
  const { data, error } = await supabase
    .from("score_runs")
    .select("repo_id, total_score, computed_at")
    .in("repo_id", repoIds)
    .order("computed_at", { ascending: false });

  if (error || !data) return new Map();
  const seen = new Set<string>();
  const map = new Map<string, number>();
  for (const row of data) {
    if (!seen.has(row.repo_id)) {
      seen.add(row.repo_id);
      map.set(row.repo_id, row.total_score);
    }
  }
  return map;
}

async function getScoresBeforeTimestamps(
  supabase: any,
  watchlist: { repo_id: string; last_viewed_at: string | null }[]
): Promise<Map<string, number>> {
  const pairs = watchlist.filter((w) => w.last_viewed_at);
  if (pairs.length === 0) return new Map();

  // Fetch all scores before each repo's cutoff, then deduplicate to keep latest per repo
  const results = await Promise.all(
    pairs.map((w) =>
      supabase
        .from("score_runs")
        .select("repo_id, total_score")
        .eq("repo_id", w.repo_id)
        .lte("computed_at", w.last_viewed_at)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  );

  const map = new Map<string, number>();
  for (const result of results) {
    const { data, error } = result;
    if (!error && data) {
      map.set(data.repo_id, data.total_score);
    }
  }
  return map;
}
