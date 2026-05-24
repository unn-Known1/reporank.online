import { generateRssFeed } from "@/lib/blog/rss";

export async function GET() {
  const xml = await generateRssFeed();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
