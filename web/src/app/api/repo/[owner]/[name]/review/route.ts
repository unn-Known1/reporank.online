import { NextResponse } from "next/server";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { createReview } from "@/lib/db/reviews";
import { getUser } from "@/lib/supabase/server";

const NO_CACHE_HEADERS = { "Cache-Control": "no-cache, no-store" };

export async function POST(req: Request, { params }: { params: { owner: string; name: string } }) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });

    const repo = await getRepoByOwnerName(params.owner, params.name);
    if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_CACHE_HEADERS });

    const payload = await req.json();
    const ratings = payload?.ratings;
    if (!ratings || typeof ratings !== 'object' || Array.isArray(ratings) || Object.keys(ratings).length === 0) {
      return NextResponse.json({ error: "At least one rating dimension is required" }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    const ratingValues = Object.values(ratings);
    if (!ratingValues.every((v) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5)) {
      return NextResponse.json({ error: "Each rating must be an integer between 1 and 5" }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (!payload?.body || String(payload.body).length < 50) {
      return NextResponse.json({ error: "Review body must be at least 50 characters" }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    if (String(payload.body).length > 5000) {
      return NextResponse.json({ error: "Review body must be at most 5000 characters" }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const githubUsername = user.user_metadata?.user_name as string | undefined;

    const result = await createReview(repo.id, user.id, ratings, payload.body, githubUsername);
    if (result.error) {
      const isDuplicate = result.error === "You've already reviewed this repository";
      return NextResponse.json(
        { error: result.error },
        { status: isDuplicate ? 409 : 500, headers: NO_CACHE_HEADERS }
      );
    }
    return NextResponse.json({ review: result.review }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error("[review/POST] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
