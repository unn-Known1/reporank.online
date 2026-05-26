import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { upsertVote, getReview } from "@/lib/db/reviews";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await req.json();

  const vote = payload?.vote;
  if (vote !== "helpful" && vote !== "unhelpful") {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  // Self-vote prevention
  const review = await getReview(id);
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.user_id === user.id) {
    return NextResponse.json({ error: "Cannot vote on your own review" }, { status: 400 });
  }

  const result = await upsertVote(user.id, id, vote);
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Failed to save vote" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}