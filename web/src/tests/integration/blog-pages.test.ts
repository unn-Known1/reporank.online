import { describe, it, expect } from "vitest";

describe("Blog post page rendering", () => {
  it("returns 200 for an existing published post", async () => {
    const res = await fetch("http://localhost:4321/blog/test-post-slug");
    expect(res.status).toBe(200);
  });

  it("returns JSON post data via API slug lookup", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts?slug=test-post-slug");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("slug", "test-post-slug");
  });

  it("returns 404 for a non-existent slug", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts?slug=nonexistent-slug-xyz");
    expect(res.status).toBe(404);
  });

  it("returns 404 for a deleted post", async () => {
    const res = await fetch("http://localhost:4321/blog/deleted-post-slug");
    expect(res.status).toBe(404);
  });
});
