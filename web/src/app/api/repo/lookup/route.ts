import { NextResponse } from "next/server";
import { getRepoByOwnerName, upsertRepoFromGitHub } from "@/lib/db/repos";
import { computeAndStoreScore } from "@/lib/db/scores";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { checkRateLimit } from "@/lib/ratelimit";
import { getGitHubToken } from "@/lib/github/token";
import { getScoringQueue } from "@/lib/queue";
import { dedupe } from "@/lib/dedup";
import { parseRepoInput } from "@/lib/utils";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many lookups. Please wait a moment." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = body?.input ? parseRepoInput(body.input) : null;
    if (!parsed) {
      return NextResponse.json({ error: "Input must be in owner/repo format" }, { status: 400 });
    }

    const { token, isUserToken } = await getGitHubToken();
    const tokenSource = isUserToken ? "user" : "app";

    console.log(
      `[lookup] ${parsed.owner}/${parsed.name}: tokenSource=${tokenSource}`
    );

    // If queue is available, use async processing
    const queue = getScoringQueue();
    if (queue) {
      const existing = await getRepoByOwnerName(parsed.owner, parsed.name);
      if (existing?.last_fetched_at) {
        const ageHours = (Date.now() - new Date(existing.last_fetched_at).getTime()) / 3600000;
        if (ageHours < 24) {
          return NextResponse.json({ status: "cached", repoId: existing.id, tokenSource: "app" as const }, { status: 200 });
        }
      }

      // Do NOT include raw token in job payload (security). Worker falls back to app token.
      let triggeredByUserId: string | undefined;
      try {
        const supabase = await supabaseServer();
        const { data: { user } } = await supabase.auth.getUser();
        triggeredByUserId = user?.id;
      } catch {
        // Outside request scope (e.g. tests) — skip userId, worker uses app token
      }
      const job = await queue.add("score", {
        owner: parsed.owner,
        name: parsed.name,
        triggeredByUserId,
      });
      return NextResponse.json({ status: "queued", jobId: job.id, tokenSource: "app" as const }, { status: 202 });
    }

    // Fallback: synchronous processing
    const dedupKey = `lookup:${isUserToken ? "user" : "app"}:${parsed.owner}/${parsed.name}`;
    let dbRepo: any;
    let rawRepo: any;
    try {
      const result = await dedupe(dedupKey, () =>
        upsertRepoFromGitHub(parsed.owner, parsed.name, token)
      );
      dbRepo = result.dbRepo;
      rawRepo = result.rawRepo;
    } catch (err: any) {
      if (err?.status === 429) {
        return NextResponse.json({
          status: "rate_limited",
          retryAfterSec: err.retryAfterSec ?? 60,
          tokenSource,
        }, { status: 429 });
      }
      throw err;
    }

    if (!dbRepo) {
      return NextResponse.json({
        error: "Failed to store repository data. Please try again.",
        tokenSource,
      }, { status: 500 });
    }

    await computeAndStoreScore(dbRepo.id, rawRepo, parsed.owner, parsed.name);
    await maybeGenerateAiReview(dbRepo.id, dbRepo.owner, dbRepo.name, { rawRepo, token });

    return NextResponse.json({ repo: dbRepo, tokenSource }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[lookup]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
