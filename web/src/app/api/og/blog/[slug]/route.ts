import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/db/blog-posts";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title ?? "RepoRank Blog";
  const author = (post as any)?.author?.name ?? "RepoRank";
  const date = post?.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const excerpt = post?.excerpt ?? "";

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
  <text x="80" y="120" fill="#06b6d4" font-family="system-ui,sans-serif" font-size="24" font-weight="700" letter-spacing="2">REPORANK BLOG</text>
  <text x="80" y="210" fill="#f1f5f9" font-family="system-ui,sans-serif" font-size="40" font-weight="800">
    ${escapeXml(title.length > 60 ? title.slice(0, 57) + "..." : title)}
  </text>
  ${excerpt ? `<text x="80" y="280" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="22">
    ${escapeXml(excerpt.length > 120 ? excerpt.slice(0, 117) + "..." : excerpt)}
  </text>` : ""}
  <text x="80" y="360" fill="#64748b" font-family="system-ui,sans-serif" font-size="20">
    By ${escapeXml(author)}${date ? ` · ${date}` : ""}
  </text>
  <text x="80" y="520" fill="#475569" font-family="system-ui,sans-serif" font-size="18">reporank.online</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
