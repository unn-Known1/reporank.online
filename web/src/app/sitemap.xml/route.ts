import { NextResponse } from "next/server";
import { getRecentRepos, getRecentReposCount } from "@/lib/db/repos";
import { getBlogSitemapEntries } from "@/lib/blog/sitemap";

const SITEMAP_SIZE = 5000;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

  if (idParam !== null) {
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return new NextResponse("Invalid sitemap id", { status: 400 });
    }
    const offset = id * SITEMAP_SIZE;
    const repos = await getRecentRepos(SITEMAP_SIZE, offset);

    const urls = repos
      .filter((r) => r.last_fetched_at)
      .map((repo) => {
        const lastMod = new Date(repo.last_fetched_at!).toISOString();
        return `  <url>
    <loc>${escapeXml(`${base}/github/${repo.owner}/${repo.name}`)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

    if (id === 0) {
      const blogEntries = await getBlogSitemapEntries();
      urls.unshift(`  <url>
    <loc>${escapeXml(base)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(`${base}/about`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${escapeXml(`${base}/faq`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${escapeXml(`${base}/blog`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${escapeXml(`${base}/extension`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${escapeXml(`${base}/blog/community`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${escapeXml(`${base}/badge-builder`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${escapeXml(`${base}/badge-builder/batch`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
      for (const entry of blogEntries) {
        urls.push(`  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified ?? new Date().toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency ?? "monthly"}</changefreq>
    <priority>${entry.priority ?? 0.5}</priority>
  </url>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }

  const total = await getRecentReposCount();
  const count = Math.max(1, Math.ceil(total / SITEMAP_SIZE));
  const sitemapIndex = Array.from({ length: count }, (_, i) => {
    return `  <sitemap>
    <loc>${escapeXml(`${base}/sitemap.xml?id=${i}`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
  }).join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapIndex}
</sitemapindex>`;

  return new NextResponse(sitemapXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
