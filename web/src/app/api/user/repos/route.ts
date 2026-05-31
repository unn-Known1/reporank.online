import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getGitHubToken } from "@/lib/github/token";
import { fetchViewerRepos } from "@/lib/github/user-repos";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = 'force-dynamic';

export type UserRepoCard = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  avatarUrl: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  languageColor: string | null;
  topics: string[];
  isArchived: boolean;
  pushedAt: string;
  totalScore: number | null;
  computedAt: string | null;
  reviewCount: number;
  aiVerdict: string | null;
  isInWatchlist: boolean;
};

// In-memory cache: keyed by userId, 5-minute TTL
const cache = new Map<string, { data: UserRepoCard[]; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Separate rate-limit key prefix for repos endpoint
const REPOS_RATE_LIMIT_KEY = "repos:";

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = await checkRateLimit(ip, REPOS_RATE_LIMIT_KEY);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const supabase = await supabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const cached = cache.get(user.id);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ repos: cached.data, total: cached.data.length, has_more: false });
    }

    const { token, isUserToken } = await getGitHubToken();
    if (!isUserToken) {
      return NextResponse.json({
        repos: [],
        total: 0,
        has_more: false,
        scope_error: true,
        message: "Your GitHub session has expired or lacks the required scope. Please sign in again.",
      });
    }

    const repos = await fetchViewerRepos(token ?? '');
    const enriched = await enrichReposWithDbData(user.id, repos);

    cache.set(user.id, { data: enriched, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({
      repos: enriched,
      total: enriched.length,
      has_more: repos.length === 500,
    });
  } catch (err) {
    console.error("[user/repos]", err);

    if ((err as any)?.status === 401) {
      return NextResponse.json({
        repos: [],
        total: 0,
        has_more: false,
        scope_error: true,
        message: "Your GitHub session has expired. Sign in again to sync your repos.",
      });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function enrichReposWithDbData(
  userId: string,
  repos: Awaited<ReturnType<typeof fetchViewerRepos>>
): Promise<UserRepoCard[]> {
  if (repos.length === 0) return [];

  const fullNames = repos.map((r) => r.nameWithOwner);
  const db = supabaseAdmin();

  const { data: dbRepos } = await db
    .from("repos")
    .select("id, owner, name, full_name")
    .in("full_name", fullNames);

  const dbRepoMap = new Map<string, { id: string; owner: string; name: string }>();
  for (const r of dbRepos ?? []) {
    dbRepoMap.set(r.full_name, r);
  }

  const repoIds = Array.from(dbRepoMap.values()).map((r) => r.id);

  const [scoreMap, reviewCountMap, aiVerdictMap, watchlistMap] = await Promise.all([
    fetchLatestScores(repoIds),
    fetchReviewCounts(repoIds),
    fetchAiVerdicts(repoIds),
    fetchWatchlistFlags(userId, repoIds),
  ]);

  return repos.map((repo): UserRepoCard => {
    const dbRepo = dbRepoMap.get(repo.nameWithOwner);
    const repoId = dbRepo?.id;
    const scoreEntry = repoId ? scoreMap.get(repoId) : undefined;
    const score = scoreEntry?.score ?? null;
    const computedAt = scoreEntry?.computedAt ?? null;
    const reviewCount = repoId ? reviewCountMap.get(repoId) ?? 0 : 0;
    const aiVerdict = repoId ? aiVerdictMap.get(repoId) ?? null : null;
    const isInWatchlist = repoId ? watchlistMap.get(repoId) ?? false : false;

    return {
      id: repoId ?? "",
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.nameWithOwner,
      avatarUrl: repo.owner.avatarUrl,
      description: repo.description,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      language: repo.primaryLanguage?.name ?? null,
      languageColor: repo.primaryLanguage?.color ?? null,
      topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
      isArchived: repo.isArchived,
      pushedAt: repo.pushedAt,
      totalScore: typeof score === "number" ? score : null,
      computedAt: typeof computedAt === "string" ? computedAt : null,
      reviewCount,
      aiVerdict,
      isInWatchlist,
    };
  });
}

async function fetchLatestScores(repoIds: string[]): Promise<Map<string, { score: number; computedAt: string }>> {
  if (repoIds.length === 0) return new Map();
  const db = supabaseAdmin();
  const { data } = await db
    .from("score_runs")
    .select("repo_id, total_score, computed_at")
    .in("repo_id", repoIds)
    .order("computed_at", { ascending: false });

  const map = new Map<string, { score: number; computedAt: string }>();
  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (!seen.has(row.repo_id)) {
      seen.add(row.repo_id);
      map.set(row.repo_id, { score: row.total_score, computedAt: row.computed_at });
    }
  }
  return map;
}

async function fetchReviewCounts(repoIds: string[]): Promise<Map<string, number>> {
  if (repoIds.length === 0) return new Map();
  const db = supabaseAdmin();
  const { data } = await db
    .from("reviews")
    .select("repo_id")
    .in("repo_id", repoIds);

  const map = new Map<string, number>();
  for (const id of repoIds) map.set(id, 0);
  for (const row of data ?? []) {
    map.set(row.repo_id, (map.get(row.repo_id) ?? 0) + 1);
  }
  return map;
}

async function fetchAiVerdicts(repoIds: string[]): Promise<Map<string, string>> {
  if (repoIds.length === 0) return new Map();
  const db = supabaseAdmin();
  const { data } = await db
    .from("ai_reviews")
    .select("repo_id, verdict")
    .in("repo_id", repoIds)
    .order("generated_at", { ascending: false });

  const map = new Map<string, string>();
  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (!seen.has(row.repo_id)) {
      seen.add(row.repo_id);
      map.set(row.repo_id, row.verdict);
    }
  }
  return map;
}

async function fetchWatchlistFlags(userId: string, repoIds: string[]): Promise<Map<string, boolean>> {
  if (repoIds.length === 0) return new Map();
  const db = supabaseAdmin();
  const { data } = await db
    .from("watchlist_items")
    .select("repo_id")
    .eq("user_id", userId)
    .in("repo_id", repoIds);

  const watchlisted = new Set((data ?? []).map((r) => r.repo_id));
  const map = new Map<string, boolean>();
  for (const id of repoIds) {
    map.set(id, watchlisted.has(id));
  }
  return map;
}
