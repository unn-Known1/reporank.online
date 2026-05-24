import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { upsertVote, getReview } from "@/lib/db/reviews";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await req.json();

  const vote = payload?.vote;
  if (vote !== "helpful" && vote !== "unhelpful") {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  // Self-vote prevention
  const review = await getReview(params.id);
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.user_id === user.id) {
    return NextResponse.json({ error: "Cannot vote on your own review" }, { status: 400 });
  }

  await upsertVote(user.id, params.id, vote);
  return NextResponse.json({ ok: true }, { status: 200 });
}