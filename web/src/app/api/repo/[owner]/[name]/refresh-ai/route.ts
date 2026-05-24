import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { getRepoByOwnerName } from "@/lib/db/repos";

// In-flight dedup: prevent concurrent AI refreshes for the same repo
const pendingAiRefreshes = new Set<string>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request, { params }: { params: { owner: string; name: string } }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed, retryAfterMs } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  const repo = await getRepoByOwnerName(params.owner, params.name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const repoKey = `${params.owner}/${params.name}`;

  // Dedup: return early if a refresh is already in progress for this repo
  if (pendingAiRefreshes.has(repoKey)) {
    return NextResponse.json(
      { error: "AI analysis already in progress for this repo" },
      { status: 429 }
    );
  }

  pendingAiRefreshes.add(repoKey);

  try {
    const admin = supabaseAdmin();
    const { data: oldReview, error: fetchError } = await admin
      .from("ai_reviews")
      .select("id")
      .eq("repo_id", repo.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: "Failed to check existing review" }, { status: 500 });
    }

    await maybeGenerateAiReview(repo.id, params.owner, params.name);

    // If generation succeeded, delete old review (if any) to avoid duplicates
    if (oldReview) {
      await admin.from("ai_reviews").delete().eq("id", oldReview.id);
    }

    return NextResponse.json({ success: true });
  } finally {
    pendingAiRefreshes.delete(repoKey);
  }
}
