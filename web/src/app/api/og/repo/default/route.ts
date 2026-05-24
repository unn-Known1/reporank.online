import { NextResponse } from "next/server";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
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
  <rect x="480" y="215" width="240" height="200" rx="24" fill="url(#accent)"/>
  <text x="600" y="335" fill="#ffffff" font-family="system-ui,sans-serif" font-size="72" font-weight="800" text-anchor="middle">RR</text>
  <text x="600" y="480" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="48" font-weight="800" text-anchor="middle">RepoRank</text>
  <text x="600" y="530" fill="#64748b" font-family="system-ui,sans-serif" font-size="24" text-anchor="middle">Repository Credibility Scores</text>
  <text x="600" y="560" fill="#475569" font-family="system-ui,sans-serif" font-size="18" text-anchor="middle">reporank.online</text>
</svg>`;

export async function GET() {
  return new NextResponse(SVG, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
