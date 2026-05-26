import { supabaseServer } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReviewRatings = {
  codeQuality: number;
  docs: number;
  maintenance: number;
  easeOfUse: number;
  security: number;
};

export type Review = {
  id: string;
  repo_id: string;
  user_id: string;
  ratings_json: ReviewRatings;
  body: string;
  created_at: string;
  is_outdated: boolean;
  spam_flagged: boolean;
  github_username: string | null;
  user?: { username: string; avatar_url: string };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectSpam(body: string): boolean {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urlCount = (body.match(urlRegex) || []).length;
  if (urlCount > 5) return true;
  if (body.length < 20 || body.length > 5000) return true;
  return false;
}

function mapReview(row: any): Review {
  const githubUsername = row.github_username ?? null;
  return {
    id: row.id,
    repo_id: row.repo_id,
    user_id: row.user_id,
    ratings_json: row.ratings_json,
    body: row.body,
    created_at: row.created_at,
    is_outdated: row.is_outdated,
    spam_flagged: row.spam_flagged,
    github_username: githubUsername,
    user: githubUsername ? { username: githubUsername, avatar_url: `https://github.com/${githubUsername}.png` } : undefined,
  };
}

// ─── Reviews ────────────────────────────────────────────────────────────────────

/**
 * Fetch reviews for a repo, ordered newest first.
 * Joins username + avatar from auth.users via raw_user_meta_data (if available).
 * Supports pagination via limit/offset.
 */
export async function getReviewsByRepo(
  repoId: string,
  limit = 20,
  offset = 0
): Promise<{ reviews: Review[]; total: number }> {
  const supabase = await supabaseServer();
  if (!supabase) return { reviews: [], total: 0 };
  const countQuery = supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("repo_id", repoId)
    .eq("spam_flagged", false);
  const dataQuery = supabase
    .from("reviews")
    .select("*")
    .eq("repo_id", repoId)
    .eq("spam_flagged", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const results = await Promise.allSettled([
    countQuery,
    dataQuery,
  ]);

  const countResult = results[0];
  const dataResult = results[1];

  const count = countResult.status === "fulfilled" ? countResult.value.count : null;
  const countError = countResult.status === "fulfilled" ? countResult.value.error : null;
  const data = dataResult.status === "fulfilled" ? dataResult.value.data : null;
  const error = dataResult.status === "fulfilled" ? dataResult.value.error : null;

  if (error || countError || !data) return { reviews: [], total: 0 };
  return { reviews: data.map(mapReview), total: count ?? 0 };
}

/**
 * Create a new review. Runs basic spam detection before insert.
 * Returns discriminated result: review on success, error message on failure.
 */
export async function createReview(
  repoId: string,
  userId: string,
  ratings: ReviewRatings,
  body: string,
  githubUsername?: string
): Promise<{ review: Review | null; error: string | null }> {
  const supabase = await supabaseServer();
  if (!supabase) return { review: null, error: "Database not configured" };

  const spamFlagged = detectSpam(body);

  if (spamFlagged) {
    console.warn(`[spam] Flagged review by user ${userId} on repo ${repoId}: body length ${body.length}`);
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      repo_id: repoId,
      user_id: userId,
      ratings_json: ratings as Record<string, number>,
      body,
      is_outdated: false,
      spam_flagged: spamFlagged,
      github_username: githubUsername ?? null,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error creating review:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    // Unique constraint violation → user already reviewed this repo
    if (error.code === "23505") {
      return { review: null, error: "You've already reviewed this repository" };
    }

    return { review: null, error: error.message || "Failed to create review" };
  }

  return { review: data ? mapReview(data) : null, error: null };
}

// ─── Summary ─────────────────────────────────────────────────────────────────────

/**
 * Get review summary for a repo — total count and average helpfulness.
 * avg_helpful is computed from actual review_votes data.
 */
export async function getReviewSummary(repoId: string): Promise<{ count: number; avg_helpful: number }> {
  const supabase = await supabaseServer();
  if (!supabase) return { count: 0, avg_helpful: 0 };

  const { count, error: countError } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("repo_id", repoId)
    .eq("spam_flagged", false);

  if (countError) return { count: 0, avg_helpful: 0 };

  const { data: votes, error: votesError } = await supabase
    .from("review_votes")
    .select("vote_type, review!inner(repo_id)")
    .eq("review.repo_id", repoId);

  if (votesError || !votes) return { count: count ?? 0, avg_helpful: 0 };

  const helpful = votes.filter((v: any) => v.vote_type === "helpful").length;
  const total = votes.length;
  const avg_helpful = total > 0 ? helpful / total : 0;

  return { count: count ?? 0, avg_helpful };
}

// ─── Single review ──────────────────────────────────────────────────────────────────

/**
 * Fetch a single review by ID. Returns only user_id for ownership checks.
 */
export async function getReview(reviewId: string): Promise<{ user_id: string } | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("reviews")
    .select("user_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (error || !data) return null;
  return data as { user_id: string };
}

// ─── Votes ─────────────────────────────────────────────────────────────────────

/**
 * Get a user's vote on a specific review. Returns 'helpful' | 'unhelpful' | null.
 */
export async function getVote(
  userId: string,
  reviewId: string
): Promise<"helpful" | "unhelpful" | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("review_votes")
    .select("vote_type")
    .eq("user_id", userId)
    .eq("review_id", reviewId)
    .maybeSingle();

  if (error) {
    console.warn("[db] getVote:", error);
    return null;
  }
  if (!data) return null;
  return data.vote_type as "helpful" | "unhelpful";
}

export async function upsertVote(
  userId: string,
  reviewId: string,
  voteType: "helpful" | "unhelpful"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  if (!supabase) return { ok: false, error: "Database not configured" };

  const { error } = await supabase
    .from("review_votes")
    .upsert(
      {
        review_id: reviewId,
        user_id: userId,
        vote_type: voteType,
      },
      { onConflict: "review_id,user_id" }
    );

  if (error) {
    console.warn("[db] upsertVote:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Alias for backward compatibility
export { upsertVote as voteOnReview };

/**
 * Mark a review as outdated. Only the review author can do this.
 */
export async function markReviewOutdated(
  reviewId: string,
  userId: string
): Promise<void> {
  const supabase = await supabaseServer();
  if (!supabase) return;

  const { error } = await supabase
    .from("reviews")
    .update({ is_outdated: true })
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) return;
}