import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetBlogPostBySlug = vi.hoisted(() => vi.fn());
const mockListBlogPosts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/blog/service", () => ({
  getBlogPostBySlug: mockGetBlogPostBySlug,
  listBlogPosts: mockListBlogPosts,
}));

describe("Blog post API slug lookup", () => {
  it("returns post data for an existing published post", async () => {
    mockGetBlogPostBySlug.mockResolvedValue({
      id: "1",
      title: "Test Post",
      slug: "test-post-slug",
      body: "Content",
      body_html: "<p>Content</p>",
      status: "published",
    });
    const { GET } = await import("@/app/api/blog/posts/route");
    const res = await GET(new NextRequest("http://localhost/api/blog/posts?slug=test-post-slug"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("slug", "test-post-slug");
  });

  it("returns 404 for a non-existent slug", async () => {
    mockGetBlogPostBySlug.mockResolvedValue(null);
    const { GET } = await import("@/app/api/blog/posts/route");
    const res = await GET(new NextRequest("http://localhost/api/blog/posts?slug=nonexistent-slug-xyz"));
    expect(res.status).toBe(404);
  });

  it("returns 404 for a non-published slug without drafts flag", async () => {
    mockGetBlogPostBySlug.mockResolvedValue({
      id: "2",
      title: "Draft Post",
      slug: "draft-post",
      status: "draft",
    });
    const { GET } = await import("@/app/api/blog/posts/route");
    const res = await GET(new NextRequest("http://localhost/api/blog/posts?slug=draft-post"));
    expect(res.status).toBe(404);
  });
});
