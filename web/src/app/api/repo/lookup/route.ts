import { NextResponse } from "next/server";
import { getRepoByOwnerName, upsertRepoFromGitHub } from "@/lib/db/repos";
import { computeAndStoreScore } from "@/lib/db/scores";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { checkRateLimit } from "@/lib/ratelimit";
import { getGitHubToken } from "@/lib/github/token";
import { getScoringQueue } from "@/lib/queue";
import { dedupe } from "@/lib/dedup";
import { parseRepoInput } from "@/lib/utils";

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

    const { token } = await getGitHubToken();

    // If queue is available, use async processing
    const queue = getScoringQueue();
    if (queue) {
      const existing = await getRepoByOwnerName(parsed.owner, parsed.name);
      if (existing?.last_fetched_at) {
        const ageHours = (Date.now() - new Date(existing.last_fetched_at).getTime()) / 3600000;
        if (ageHours < 24) {
          return NextResponse.json({ status: "cached", repoId: existing.id }, { status: 200 });
        }
      }

      const job = await queue.add("score", {
        owner: parsed.owner,
        name: parsed.name,
        token: token || undefined,
      });
      return NextResponse.json({ status: "queued", jobId: job.id }, { status: 202 });
    }

    // Fallback: synchronous processing
    // Use a stable key without exposing token bytes
    const tokenHash = token
      ? Buffer.from(token).toString("base64").slice(0, 12)
      : "anon";
    const userKey = token ? `user:${tokenHash}` : "anon";
    const repoKey = `${parsed.owner}/${parsed.name}`;
    const { dbRepo, rawRepo } = await dedupe(`lookup:${userKey}:${repoKey}`, () =>
      upsertRepoFromGitHub(parsed.owner, parsed.name, token)
    );
    if (!dbRepo) return NextResponse.json({ error: "Repository could not be found or is inaccessible. Check the owner/repo name and try again." }, { status: 404 });

    await computeAndStoreScore(dbRepo.id, rawRepo);
    await maybeGenerateAiReview(dbRepo.id, dbRepo.owner, dbRepo.name, { rawRepo, token });

    return NextResponse.json({ repo: dbRepo }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[lookup]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}