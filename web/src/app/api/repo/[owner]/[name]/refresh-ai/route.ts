import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { getGitHubToken } from "@/lib/github/token";

export const dynamic = 'force-dynamic';

// In-flight dedup: prevent concurrent AI refreshes for the same repo (with TTL)
const pendingAiRefreshes = new Map<string, number>();
const REFRESH_TIMEOUT_MS = 120_000; // 2 minutes

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
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

  const repo = await getRepoByOwnerName(owner, name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const repoKey = `${owner}/${name}`;

  // Cleanup stale entries
  for (const [key, timestamp] of pendingAiRefreshes) {
    if (Date.now() - timestamp > REFRESH_TIMEOUT_MS) {
      pendingAiRefreshes.delete(key);
    }
  }

  // Enforce size cap
  if (pendingAiRefreshes.size > 1000) {
    const entries = [...pendingAiRefreshes.entries()];
    const toDelete = entries.slice(0, entries.length - 1000);
    for (const [key] of toDelete) pendingAiRefreshes.delete(key);
  }

  // Dedup: return early if a refresh is already in progress for this repo
  if (pendingAiRefreshes.has(repoKey)) {
    return NextResponse.json(
      { error: "AI analysis already in progress for this repo" },
      { status: 409 }
    );
  }

  pendingAiRefreshes.set(repoKey, Date.now());

  try {
    // Pass user token to AI review pipeline for BYOT quota isolation
    // generateAndStoreAiReview handles upsert internally (update existing or insert new)
    const { token, isUserToken } = await getGitHubToken();
    console.log(`[refresh-ai] ${owner}/${name}: tokenSource=${isUserToken ? "user" : "app"}`);
    await maybeGenerateAiReview(repo.id, owner, name, { token: token ?? undefined });

    return NextResponse.json({ success: true });
  } finally {
    pendingAiRefreshes.delete(repoKey);
  }
}
