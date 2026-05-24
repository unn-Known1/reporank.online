import { describe, it, expect, vi } from "vitest";

const mockGenerateRssFeed = vi.hoisted(() => vi.fn());

vi.mock("@/lib/blog/rss", () => ({
  generateRssFeed: mockGenerateRssFeed,
}));

describe("GET /blog/feed.xml", () => {
  it("returns valid RSS XML with correct content type", async () => {
    mockGenerateRssFeed.mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Test Blog</title><description>Test</description><link>http://localhost</link></channel></rss>'
    );
    const { GET } = await import("@/app/blog/feed.xml/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
  });

  it("contains required RSS elements", async () => {
    mockGenerateRssFeed.mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Test Blog</title><description>Test</description><link>http://localhost</link></channel></rss>'
    );
    const { GET } = await import("@/app/blog/feed.xml/route");
    const res = await GET();
    const text = await res.text();
    expect(text).toContain("<rss");
    expect(text).toContain("<channel>");
    expect(text).toContain("<title>");
    expect(text).toContain("<description>");
    expect(text).toContain("<link>");
  });

  it("contains at least one <item> when posts exist", async () => {
    mockGenerateRssFeed.mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Test Blog</title><description>Test</description><link>http://localhost</link><item><title>Post 1</title></item></channel></rss>'
    );
    const { GET } = await import("@/app/blog/feed.xml/route");
    const res = await GET();
    const text = await res.text();
    expect(text).toContain("<item>");
  });

  it("returns well-formed XML", async () => {
    mockGenerateRssFeed.mockResolvedValue(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Test Blog</title></channel></rss>'
    );
    const { GET } = await import("@/app/blog/feed.xml/route");
    const res = await GET();
    const text = await res.text();
    expect(text.startsWith("<?xml")).toBe(true);
  });
});
