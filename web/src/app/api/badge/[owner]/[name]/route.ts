import { NextResponse } from "next/server";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { getLatestScore } from "@/lib/db/scores";
import { renderBadgeSvg } from "@/lib/badge/svg";
import { parseBadgeParams } from "@/lib/badge/badge-config";

function resolveName(name: string): string {
  return name.replace(/\.svg$/i, "");
}

async function fetchScoreValue(owner: string, repoName: string, subscore: string | null): Promise<number | null> {
  const repo = await getRepoByOwnerName(owner, repoName);
  if (!repo) return null;
  const score = await getLatestScore(repo.id);
  if (!score) return null;
  if (subscore && score.subscores_json) {
    const subs = score.subscores_json as Record<string, number>;
    return subs[subscore] ?? null;
  }
  return score.total_score;
}

export async function GET(request: Request, { params }: { params: { owner: string; name: string } }) {
  const repoName = resolveName(params.name);
  const url = new URL(request.url);
  const badgeConfig = parseBadgeParams(url);

  const scoreValue = await fetchScoreValue(params.owner, repoName, badgeConfig.subscore);

  badgeConfig.scoreValue = scoreValue;
  const svg = renderBadgeSvg(badgeConfig);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      ...(scoreValue == null ? { "Cache-Control": "no-cache" } : { "Cache-Control": "public, max-age=3600" }),
    },
  });
}
