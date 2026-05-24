import { describe, it, expect } from "vitest";

describe("GET /blog/feed.xml", () => {
  it("returns valid RSS XML with correct content type", async () => {
    const res = await fetch("http://localhost:4321/blog/feed.xml");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
  });

  it("contains required RSS elements", async () => {
    const res = await fetch("http://localhost:4321/blog/feed.xml");
    const text = await res.text();
    expect(text).toContain("<rss");
    expect(text).toContain("<channel>");
    expect(text).toContain("<title>");
    expect(text).toContain("<description>");
    expect(text).toContain("<link>");
  });

  it("contains at least one <item> when posts exist", async () => {
    const res = await fetch("http://localhost:4321/blog/feed.xml");
    const text = await res.text();
    expect(text).toContain("<item>");
  });

  it("returns well-formed XML", async () => {
    const res = await fetch("http://localhost:4321/blog/feed.xml");
    const text = await res.text();
    expect(text.startsWith("<?xml")).toBe(true);
  });
});
