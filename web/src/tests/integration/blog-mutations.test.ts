import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockUpdateBlogPost = vi.hoisted(() => vi.fn());
const mockDeleteBlogPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  getUser: mockGetUser,
  supabaseServer: vi.fn(),
}));

vi.mock("@/lib/blog/service", () => ({
  updateBlogPost: mockUpdateBlogPost,
  deleteBlogPost: mockDeleteBlogPost,
  getBlogPostById: vi.fn(),
}));

async function loadId() {
  const { GET } = await import("@/app/api/blog/posts/[id]/route");
  return GET;
}

describe("PUT /api/blog/posts/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue(null);
    const { PUT } = await import("@/app/api/blog/posts/[id]/route");
    const req = new NextRequest("http://localhost/api/blog/posts/fake-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "fake-id" }) });
    expect(res.status).toBe(401);
  });

  it("returns 500 for non-existent post", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });
    mockUpdateBlogPost.mockResolvedValue({ success: false, errors: [{ field: "_", message: "Post not found" }] });
    const { PUT } = await import("@/app/api/blog/posts/[id]/route");
    const req = new NextRequest("http://localhost/api/blog/posts/non-existent-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "non-existent-id" }) });
    expect(res.status).toBe(500);
  });

  it("rejects invalid update payload", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });
    mockUpdateBlogPost.mockResolvedValue({ success: false, errors: [{ field: "title", message: "Title too long" }] });
    const { PUT } = await import("@/app/api/blog/posts/[id]/route");
    const req = new NextRequest("http://localhost/api/blog/posts/fake-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x".repeat(201) }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "fake-id" }) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/blog/posts/[id]", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires authentication", async () => {
    mockGetUser.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/blog/posts/[id]/route");
    const req = new NextRequest("http://localhost/api/blog/posts/fake-id", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "fake-id" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent post", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });
    mockDeleteBlogPost.mockResolvedValue(false);
    const { DELETE } = await import("@/app/api/blog/posts/[id]/route");
    const req = new NextRequest("http://localhost/api/blog/posts/non-existent-id", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "non-existent-id" }) });
    expect(res.status).toBe(404);
  });
});
