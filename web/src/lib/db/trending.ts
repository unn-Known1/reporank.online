import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TrendingEntry } from "./db-schema";

export async function getTrendingSnapshot(
  language?: string | null,
  sort: "trending" | "top_rated" = "trending"
): Promise<TrendingEntry[]> {
  const supabase = await supabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("trending_cache")
    .select("data, generated_at")
    .eq("id", "trending")
    .maybeSingle();

  if (error || !data) return [];

  // Enforce TTL: return empty if cache is older than 6 hours
  const cacheAge = Date.now() - new Date(data.generated_at).getTime();
  if (cacheAge > 6 * 60 * 60 * 1000) {
    return [];
  }

  const entries: TrendingEntry[] = (data.data as any[]) ?? [];
  const generatedAt = data.generated_at;

  let filtered = entries;
  if (language) {
    const langLower = language.toLowerCase();
    filtered = entries.filter(
      (e) => e.language?.toLowerCase() === langLower
    );
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "top_rated") return b.total_score - a.total_score;
    return b.score_velocity - a.score_velocity;
  });

  return sorted.map((e) => ({ ...e, generated_at: generatedAt }));
}

export async function computeTrendingSnapshot(): Promise<{
  entries: TrendingEntry[];
  generated_at: string;
}> {
  const supabase = supabaseAdmin();

  // Fetch repos scored in the past 14 days (freshness threshold)
  const { data: recentRuns, error: runsError } = await supabase
    .from("score_runs")
    .select("repo_id, total_score, computed_at")
    .gte("computed_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .order("computed_at", { ascending: false });

  if (runsError || !recentRuns) {
    console.warn("[db] computeTrendingSnapshot: failed to fetch recent runs", runsError);
    return { entries: [], generated_at: new Date().toISOString() };
  }

  // Collect unique repo IDs for batch fetch
  const repoIds = [...new Set(recentRuns.map((r) => r.repo_id))];

  // Batch fetch all repos in a single query
  const { data: reposData, error: reposError } = await supabase
    .from("repos")
    .select("id, owner, name, full_name, language, stars")
    .in("id", repoIds);

  if (reposError) {
    console.error("[trending] Failed to fetch repos:", reposError);
  }

  const repoMap = new Map<string, { owner: string; name: string; full_name: string; language: string | null; stars: number }>();
  if (reposData) {
    for (const r of reposData) {
      repoMap.set(r.id, { owner: r.owner, name: r.name, full_name: r.full_name, language: r.language, stars: r.stars });
    }
  }

  // Group by repo_id, take latest score, also find score from ~7 days ago
  const repoLatest = new Map<string, { score: number; computed_at: string; language: string | null; name: string; owner: string; full_name: string; stars: number }>();
  const repo7dAgo = new Map<string, number>();

  for (const run of recentRuns) {
    if (!repoLatest.has(run.repo_id)) {
      const repoData = repoMap.get(run.repo_id);
      if (repoData) {
        repoLatest.set(run.repo_id, {
          score: run.total_score,
          computed_at: run.computed_at,
          language: repoData.language,
          name: repoData.name,
          owner: repoData.owner,
          full_name: repoData.full_name,
          stars: repoData.stars,
        });
      }
    }

    // Track score approximately 7 days ago
    const runTime = new Date(run.computed_at).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (runTime <= sevenDaysAgo && !repo7dAgo.has(run.repo_id)) {
      repo7dAgo.set(run.repo_id, run.total_score);
    }
  }

  const entries: TrendingEntry[] = [];
  const now = new Date().toISOString();

  for (const [repoId, latest] of repoLatest) {
    const score7d = repo7dAgo.get(repoId) ?? latest.score;
    const scoreChange = latest.score - score7d;
    const velocity = scoreChange * 0.7 + latest.score * 0.3; // weighted: momentum + absolute

    if (velocity > 0) {
      entries.push({
        repo_id: repoId,
        full_name: latest.full_name,
        owner: latest.owner,
        name: latest.name,
        language: latest.language,
        stars: latest.stars,
        total_score: latest.score,
        score_velocity: Math.round(velocity * 10) / 10,
        computed_at: latest.computed_at,
        generated_at: now,
      });
    }
  }

  entries.sort((a, b) => b.score_velocity - a.score_velocity);
  const top100 = entries.slice(0, 100);

  // Cache the snapshot
  const { error: cacheError } = await supabase
    .from("trending_cache")
    .upsert({ id: "trending", data: top100, generated_at: now }, { onConflict: "id" });

  if (cacheError) {
    console.warn("[db] computeTrendingSnapshot: failed to cache", cacheError);
  }

  return { entries: top100, generated_at: now };
}
