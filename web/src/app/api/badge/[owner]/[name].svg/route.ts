import { NextResponse } from "next/server";
import { getRepoByOwnerName, upsertRepoFromGitHub } from "@/lib/db/repos";
import { getLatestScore, computeAndStoreScore } from "@/lib/db/scores";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { dedupe } from "@/lib/dedup";
import { renderBadgeSvg } from "@/lib/badge/svg";

function resolveName(name: string): string {
  return name.endsWith(".svg") ? name.slice(0, -4) : name;
}

async function tryGetScore(owner: string, repoName: string): Promise<number | null> {
  const repo = await getRepoByOwnerName(owner, repoName);
  if (!repo) return null;
  const score = await getLatestScore(repo.id);
  return score?.total_score ?? null;
}

async function tryGetBadgeToken(): Promise<string | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) return session.provider_token;
  } catch {}
  try {
    return process.env.GITHUB_APP_TOKEN ?? null;
  } catch {
    return null;
  }
}

async function tryLookup(owner: string, repoName: string): Promise<number | null> {
  const token = await tryGetBadgeToken();
  if (!token) return null;
  try {
    const result = await dedupe(`badge:${owner}/${repoName}`, () =>
      upsertRepoFromGitHub(owner, repoName, token)
    );
    if (!result.dbRepo) return null;
    await computeAndStoreScore(result.dbRepo.id, result.rawRepo);
    maybeGenerateAiReview(result.dbRepo.id, result.dbRepo.owner, result.dbRepo.name, {
      rawRepo: result.rawRepo,
      token,
    });
    const score = await getLatestScore(result.dbRepo.id);
    return score?.total_score ?? null;
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: { params: { owner: string; name: string } }) {
  const rawName = params.name;
  const repoName = rawName.endsWith(".svg") ? rawName.slice(0, -4) : rawName;
  const repoOwner = params.owner;

  let score = await tryGetScore(repoOwner, repoName);
  if (score == null) {
    score = await tryLookup(repoOwner, repoName);
  }

  if (rawName === "debug") {
    const dbRepo = await getRepoByOwnerName(repoOwner, repoName);
    const dbScore = dbRepo ? await getLatestScore(dbRepo.id) : null;
    return NextResponse.json({
      rawName,
      repoName,
      repoOwner,
      dbRepo: dbRepo ? { id: dbRepo.id, name: dbRepo.name, owner: dbRepo.owner } : null,
      dbScore: dbScore?.total_score ?? null,
      returnedScore: score,
    });
  }

  const svg = renderBadgeSvg(score);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      ...(score == null ? { "Cache-Control": "no-cache" } : { "Cache-Control": "public, max-age=3600" }),
    },
  });
}
