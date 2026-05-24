import { NextResponse } from "next/server";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { getLatestScore } from "@/lib/db/scores";
import { renderBadgeSvg } from "@/lib/badge/svg";

export async function GET(_: Request, { params }: { params: { owner: string; name: string } }) {
  const repoName = params.name;
  let repo = await getRepoByOwnerName(params.owner, repoName);
  if (!repo && params.name.endsWith(".svg")) {
    const stripped = params.name.slice(0, -4);
    repo = await getRepoByOwnerName(params.owner, stripped);
  }
  if (!repo) {
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="RepoRank: not found">
  <rect width="60" height="20" fill="#555"/>
  <text x="30" y="14" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial">REPORANK</text>
  <rect x="60" width="60" height="20" fill="#e53e3e"/>
  <text x="90" y="14" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial">NOT FOUND</text>
</svg>`;
    return new NextResponse(errorSvg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" },
      status: 404,
    });
  }

  const score = await getLatestScore(repo.id);
  const svg = renderBadgeSvg(score?.total_score ?? null);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
