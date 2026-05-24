import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const mockListBlogPosts = vi.hoisted(() => vi.fn());
const mockGetBlogPostBySlug = vi.hoisted(() => vi.fn());

vi.mock("@/lib/blog/service", () => ({
  listBlogPosts: mockListBlogPosts,
  getBlogPostBySlug: mockGetBlogPostBySlug,
}));

describe("GET /api/blog/posts", () => {
  it("returns paginated published posts", async () => {
    mockListBlogPosts.mockResolvedValue({
      posts: [{ id: "1", title: "Test Post", slug: "test-post", status: "published" }],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });
    const { GET } = await import("@/app/api/blog/posts/route");
    const res = await GET(new NextRequest("http://localhost/api/blog/posts?page=1&limit=10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("posts");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });

  it("returns empty state when no posts exist", async () => {
    mockListBlogPosts.mockResolvedValue({
      posts: [],
      pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
    });
    const { GET } = await import("@/app/api/blog/posts/route");
    const res = await GET(new NextRequest("http://localhost/api/blog/posts"));
    const body = await res.json();
    expect(Array.isArray(body.posts)).toBe(true);
    expect(body.posts.length).toBe(0);
  });

  it("filters by status", async () => {
    mockListBlogPosts.mockResolvedValue({
      posts: [{ id: "1", title: "Published Post", slug: "pub-post", status: "published" }],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });
    const { GET } = await import("@/app/api/blog/posts/route");
    const res = await GET(new NextRequest("http://localhost/api/blog/posts"));
    const body = await res.json();
    for (const post of body.posts) {
      expect(post.status).toBe("published");
    }
  });

  it("paginates correctly with multiple pages", async () => {
    const mockPosts = Array.from({ length: 3 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Post ${i + 1}`,
      slug: `post-${i + 1}`,
      status: "published",
    }));
    mockListBlogPosts.mockResolvedValue({
      posts: [mockPosts[0]],
      pagination: { page: 1, limit: 1, total: 3, total_pages: 3 },
    });
    const { GET } = await import("@/app/api/blog/posts/route");
    const res = await GET(new NextRequest("http://localhost/api/blog/posts?page=1&limit=1"));
    const body = await res.json();
    expect(body.pagination.total_pages).toBe(3);
  });
});
