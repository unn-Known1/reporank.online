import { NextResponse } from "next/server";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { getLatestScore } from "@/lib/db/scores";
import { getAiReview } from "@/lib/db/ai";
import { getReviewSummary, getReviewsByRepo } from "@/lib/db/reviews";

export async function GET(request: Request, { params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const repo = await getRepoByOwnerName(owner, name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const rawPage = parseInt(searchParams.get("reviews_page") ?? "1", 10);
  const reviewsPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const rawLimit = parseInt(searchParams.get("reviews_limit") ?? "5", 10);
  const reviewsLimit = isNaN(rawLimit) ? 5 : Math.max(1, Math.min(rawLimit, 100));
  const offset = Math.max(0, (reviewsPage - 1) * reviewsLimit);

  const [score, ai_review, review_summary, reviewsResult] = await Promise.all([
    getLatestScore(repo.id),
    getAiReview(repo.id),
    getReviewSummary(repo.id),
    getReviewsByRepo(repo.id, reviewsLimit, offset),
  ]);

  const reviews = reviewsResult.reviews.map((r) => ({
    ...r,
    is_author: r.github_username === repo.owner,
  }));

  return NextResponse.json({ repo, score, ai_review, review_summary, reviews, total_reviews: reviewsResult.total }, {
    status: 200,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}