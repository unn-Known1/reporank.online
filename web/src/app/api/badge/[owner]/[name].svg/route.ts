import { NextResponse } from "next/server";
import { getRepoByOwnerName, upsertRepoFromGitHub } from "@/lib/db/repos";
import { getLatestScore, computeAndStoreScore } from "@/lib/db/scores";
import { maybeGenerateAiReview } from "@/lib/db/ai";
import { getGitHubToken } from "@/lib/github/token";
import { dedupe } from "@/lib/dedup";
import { renderBadgeSvg } from "@/lib/badge/svg";

function resolveName(name: string): string {
  return name.endsWith(".svg") ? name.slice(0, -4) : name;
}

function notFoundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="RepoRank: not found">
  <rect width="60" height="20" fill="#555"/>
  <text x="30" y="14" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial">REPORANK</text>
  <rect x="60" width="60" height="20" fill="#64748b"/>
  <text x="90" y="14" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial">—</text>
</svg>`;
}

function errorSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="RepoRank: error">
  <rect width="60" height="20" fill="#555"/>
  <text x="30" y="14" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial">REPORANK</text>
  <rect x="60" width="60" height="20" fill="#dc2626"/>
  <text x="90" y="14" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial">ERR</text>
</svg>`;
}

export async function GET(_: Request, { params }: { params: { owner: string; name: string } }) {
  try {
    const repoName = resolveName(params.name);
    let repo = await getRepoByOwnerName(params.owner, repoName);

    // If repo doesn't exist in DB, trigger a lookup
    if (!repo) {
      const { token } = await getGitHubToken();
      const result = await dedupe(`badge:${params.owner}/${repoName}`, () =>
        upsertRepoFromGitHub(params.owner, repoName, token)
      );
      if (!result.dbRepo) {
        return new NextResponse(notFoundSvg(), {
          status: 200,
          headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" },
        });
      }
      repo = result.dbRepo;
      await computeAndStoreScore(repo.id, result.rawRepo);
      maybeGenerateAiReview(repo.id, repo.owner, repo.name, { rawRepo: result.rawRepo, token });
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
  } catch {
    return new NextResponse(errorSvg(), {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-cache" },
    });
  }
}
