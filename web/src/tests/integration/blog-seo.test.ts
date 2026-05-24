import { describe, it, expect } from "vitest";

describe("Blog SEO metadata", () => {
  it("returns correct <title> tag on blog listing page", async () => {
    const res = await fetch("http://localhost:4321/blog");
    const html = await res.text();
    expect(html).toContain("<title");
    expect(html).toContain("Blog");
  });

  it("returns Open Graph tags on blog listing page", async () => {
    const res = await fetch("http://localhost:4321/blog");
    const html = await res.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:type"');
  });

  it("returns correct <title> tag on individual blog post page", async () => {
    const res = await fetch("http://localhost:4321/blog/test-post-slug");
    const html = await res.text();
    expect(html).toContain("<title");
  });

  it("includes JSON-LD structured data on post pages", async () => {
    const res = await fetch("http://localhost:4321/blog/test-post-slug");
    const html = await res.text();
    expect(html).toContain('"@type":"BlogPosting"');
  });

  it("includes canonical URL in blog post pages", async () => {
    const res = await fetch("http://localhost:4321/blog/test-post-slug");
    const html = await res.text();
    expect(html).toContain('rel="canonical"');
  });
});
