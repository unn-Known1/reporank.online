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

export async function GET(request: Request, { params }: { params: { owner: string; name: string } }) {
  const rawName = params.name;
  const repoName = rawName.replace(/\.svg$/, "");
  const fullUrl = request.url;
  const debug = Object.fromEntries(new URL(fullUrl).searchParams.entries());

  let score: number | null = null;
  let dbRepoInfo: Record<string, unknown> | null = null;
  try {
    const repo = await getRepoByOwnerName(params.owner, repoName);
    if (repo) {
      dbRepoInfo = { id: repo.id, name: repo.name, owner: repo.owner };
      const dbScore = await getLatestScore(repo.id);
      score = dbScore?.total_score ?? null;
    }
  } catch (e) {
    return NextResponse.json({ error: String(e), rawName, repoName, fullUrl, debug });
  }

  return NextResponse.json({ rawName, repoName, paramsOwner: params.owner, score: "returned " + score, dbRepoInfo, fullUrl, debug });
}
