import { describe, it, expect, vi } from "vitest";

const mockGenerateRssFeed = vi.hoisted(() => vi.fn());

vi.mock("@/lib/blog/rss", () => ({
  generateRssFeed: mockGenerateRssFeed,
}));

describe("Blog RSS feed metadata", () => {
  it("returns RSS with correct content type and charset", async () => {
    mockGenerateRssFeed.mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>RepoRank Blog</title></channel></rss>'
    );
    const { GET } = await import("@/app/blog/feed.xml/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
    expect(res.headers.get("content-type")).toContain("charset=utf-8");
  });

  it("includes SEO-friendly cache headers", async () => {
    mockGenerateRssFeed.mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>RepoRank Blog</title></channel></rss>'
    );
    const { GET } = await import("@/app/blog/feed.xml/route");
    const res = await GET();
    const cacheControl = res.headers.get("cache-control") ?? "";
    expect(cacheControl).toMatch(/max-age=/);
    expect(cacheControl).toMatch(/s-maxage=/);
  });

  it("generates XML content with channel element", async () => {
    mockGenerateRssFeed.mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>RepoRank Blog</title><description>Blog about repo credibility</description><link>https://reporank.online</link></channel></rss>'
    );
    const { GET } = await import("@/app/blog/feed.xml/route");
    const res = await GET();
    const text = await res.text();
    expect(text).toContain("<rss");
    expect(text).toContain("<channel>");
    expect(text).toContain("<title>RepoRank Blog</title>");
  });
});
