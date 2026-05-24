import { describe, it, expect } from "vitest";

describe("PUT /api/blog/posts/[id]", () => {
  it("requires authentication", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts/fake-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent post", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts/non-existent-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(res.status).toBe(404);
  });

  it("rejects invalid update payload", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts/fake-id", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x".repeat(201) }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/blog/posts/[id]", () => {
  it("requires authentication", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts/fake-id", {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent post", async () => {
    const res = await fetch("http://localhost:4321/api/blog/posts/non-existent-id", {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });
});
