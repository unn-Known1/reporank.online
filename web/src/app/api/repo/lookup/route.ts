import { NextResponse } from "next/server";
import { getRepoByOwnerName, upsertRepoFromGitHub } from "@/lib/db/repos";
import { computeAndStoreScore } from "@/lib/db/scores";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { checkRateLimit } from "@/lib/ratelimit";
import { getGitHubToken, getAppToken } from "@/lib/github/token";
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
          return NextResponse.json({ status: "cached", repoId: existing.id, tokenSource }, { status: 200 });
        }
      }

      // Do NOT include raw token in job payload (security). Worker falls back to app token.
      let triggeredByUserId: string | undefined;
      try {
        const supabase = await supabaseServer();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          triggeredByUserId = user?.id;
        }
      } catch {
        // Outside request scope (e.g. tests) — skip userId, worker uses app token
      }
      const job = await queue.add("score", {
        owner: parsed.owner,
        name: parsed.name,
        triggeredByUserId,
      });
      return NextResponse.json({ status: "queued", jobId: job.id, tokenSource }, { status: 202 });
    }

    // Fallback: synchronous processing
    const existing = await getRepoByOwnerName(parsed.owner, parsed.name);
    if (existing?.last_fetched_at) {
      const ageHours = (Date.now() - new Date(existing.last_fetched_at).getTime()) / 3600000;
      if (ageHours < 24) {
        return NextResponse.json({ status: "cached", repoId: existing.id, tokenSource }, { status: 200 });
      }
    }

    const dedupKey = `lookup:${isUserToken ? "user" : "app"}:${parsed.owner}/${parsed.name}`;
    let dbRepo: any;
    let rawRepo: any;
    let tokenSourceUsed = tokenSource;

    try {
      const result = await dedupe(dedupKey, () =>
        upsertRepoFromGitHub(parsed.owner, parsed.name, token ?? undefined)
      );
      dbRepo = result.dbRepo;
      rawRepo = result.rawRepo;
    } catch (err: any) {
      const errMsg = err?.message ?? "";

      if (err?.status === 429) {
        return NextResponse.json({
          status: "rate_limited",
          retryAfterSec: err.retryAfterSec ?? 60,
          tokenSource,
        }, { status: 429 });
      }

      // If user token is unauthorized/forbidden, retry with app token
      const isAuthError = errMsg.includes("UNAUTHORIZED") || errMsg.includes("FORBIDDEN") || errMsg.includes("Bad credentials");
      if (isAuthError && isUserToken) {
        console.log(`[lookup] User token failed for ${parsed.owner}/${parsed.name}, retrying with app token`);
        const appToken = getAppToken();
        if (!appToken) {
          return NextResponse.json({
            error: "GitHub authentication failed. Try signing out and signing back in.",
            tokenSource,
          }, { status: 403 });
        }
        tokenSourceUsed = "app";
        const retryKey = `lookup:app:${parsed.owner}/${parsed.name}`;
        const result = await dedupe(retryKey, () =>
          upsertRepoFromGitHub(parsed.owner, parsed.name, appToken)
        );
        dbRepo = result.dbRepo;
        rawRepo = result.rawRepo;
      } else if (errMsg.includes("NOT_FOUND")) {
        return NextResponse.json({
          error: "Repository not found on GitHub.",
          tokenSource,
        }, { status: 404 });
      } else {
        throw err;
      }
    }

    if (!dbRepo) {
      // upsert succeeded at GitHub fetch but DB upsert failed
      if (tokenSourceUsed === "user") {
        const appToken = getAppToken();
        if (appToken) {
          console.log("[lookup] User token upsert failed, retrying DB write with app token");
          tokenSourceUsed = "app";
          const retryKey = `lookup:app:${parsed.owner}/${parsed.name}`;
          const result = await dedupe(retryKey, () =>
            upsertRepoFromGitHub(parsed.owner, parsed.name, appToken)
          );
          dbRepo = result.dbRepo;
          rawRepo = result.rawRepo;
        }
      }
      if (!dbRepo) {
        return NextResponse.json({
          error: "Failed to store repository data. Please try again.",
          tokenSource,
        }, { status: 500 });
      }
    }

    // Score is fast (pure computation) — do synchronously so page loads with data
    try {
      await computeAndStoreScore(dbRepo.id, rawRepo, parsed.owner, parsed.name);
    } catch (scoreErr) {
      console.error("[lookup] Score computation failed (non-fatal):", scoreErr);
    }

    // AI analysis is slow — fire and forget so the user can navigate immediately
    maybeGenerateAiReview(dbRepo.id, dbRepo.owner, dbRepo.name, { rawRepo, token: token ?? undefined }).catch(
      (err) => console.error("[lookup] Background AI review failed:", err)
    );

    return NextResponse.json({ repo: dbRepo, tokenSource: tokenSourceUsed }, { status: 200 });
  } catch (err) {
    console.error("[lookup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
