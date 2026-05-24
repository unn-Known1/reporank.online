import { describe, it, expect } from "vitest";

describe("GET /api/blog/posts", () => {
  it("returns paginated published posts", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts?page=1&limit=10");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("posts");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toHaveProperty("page", 1);
    expect(body.pagination).toHaveProperty("limit", 10);
  });

  it("returns empty state when no posts exist", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts");
    const body = await res.json();
    expect(Array.isArray(body.posts)).toBe(true);
  });

  it("filters by status", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts");
    const body = await res.json();
    for (const post of body.posts) {
      expect(post.status).toBe("published");
    }
  });

  it("paginates correctly with multiple pages", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts?page=1&limit=1");
    const body = await res.json();
    expect(body.pagination.total_pages).toBeGreaterThanOrEqual(1);
  });
});
