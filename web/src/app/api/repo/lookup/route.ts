import { NextResponse } from "next/server";
import { getRepoByOwnerName, upsertRepoFromGitHub } from "@/lib/db/repos";
import { computeAndStoreScore } from "@/lib/db/scores";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { checkRateLimit } from "@/lib/ratelimit";
import { getGitHubToken } from "@/lib/github/token";
import { getScoringQueue } from "@/lib/queue";
import { dedupe } from "@/lib/dedup";

function parseRepoInput(input: string): { owner: string; name: string } | null {
  let trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > 200) return null;
  const githubUrlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/.*)?$/
  );
  if (githubUrlMatch) {
    const [, owner, name] = githubUrlMatch;
    return { owner, name };
  }
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [owner, name] = parts;
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  return { owner, name };
}

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
    const userKey = token ? `user:${token.slice(0, 8)}` : "anon";
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