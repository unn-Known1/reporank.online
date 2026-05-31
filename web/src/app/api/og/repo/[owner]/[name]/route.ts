import { NextResponse } from "next/server";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { getLatestScore } from "@/lib/db/scores";

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await params;
  const repo = await getRepoByOwnerName(owner, name);
  const score = repo ? await getLatestScore(repo.id) : null;
  const total = score ? Math.round(score.total_score) : null;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" rx="16"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#334155" stroke-width="1" rx="12"/>
  <text x="80" y="130" fill="#06b6d4" font-family="system-ui,sans-serif" font-size="28" font-weight="700" letter-spacing="2">REPORANK</text>
  <text x="80" y="200" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="48" font-weight="800">${escapeXml(owner)}/<tspan fill="#94a3b8">${escapeXml(name)}</tspan></text>
  ${total !== null ? `
  <text x="80" y="310" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="96" font-weight="800">${total}</text>
  <text x="190" y="310" fill="#64748b" font-family="system-ui,sans-serif" font-size="48" font-weight="500">/100</text>
  <rect x="80" y="340" width="${Math.min(total * 10, 1000)}" height="16" rx="8" fill="url(#accent)"/>
  <rect x="80" y="340" width="1000" height="16" rx="8" fill="none" stroke="#334155" stroke-width="1"/>
  ` : `
  <text x="80" y="310" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="48" font-weight="500">No score yet</text>
  `}
  <text x="80" y="430" fill="#64748b" font-family="system-ui,sans-serif" font-size="24">Repository Credibility Score</text>
  <text x="80" y="510" fill="#475569" font-family="system-ui,sans-serif" font-size="20">reporank.online</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
