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
  const repoName = resolveName(params.name);

  let score = await tryGetScore(params.owner, repoName);
  if (score == null) {
    score = await tryLookup(params.owner, repoName);
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
