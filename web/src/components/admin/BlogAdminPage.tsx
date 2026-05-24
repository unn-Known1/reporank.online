"use client";

import { useState, useEffect, useCallback } from "react";
import BlogEditor from "@/components/admin/BlogEditor";

interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  created_at: string;
  published_at: string | null;
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog/posts?include_drafts=true&limit=100");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/blog/posts/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleStatusToggle = useCallback(async (post: BlogPostSummary) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, status: newStatus as "draft" | "published", published_at: newStatus === "published" ? new Date().toISOString() : p.published_at }
              : p,
          ),
        );
      }
    } catch {
      // ignore
    }
  }, []);

  if (creating) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">New Blog Post</h1>
          <button
            onClick={() => setCreating(false)}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            &larr; Back
          </button>
        </div>
        <BlogEditor onSaved={() => { setCreating(false); fetchPosts(); }} />
      </div>
    );
  }

  if (editingPostId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Edit Blog Post</h1>
          <button
            onClick={() => setEditingPostId(null)}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            &larr; Back
          </button>
        </div>
        <BlogEditor postId={editingPostId} onSaved={() => { setEditingPostId(null); fetchPosts(); }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Blog Management</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New Post
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          Loading...
        </div>
      ) : posts.length === 0 ? (
        <div className="blog-empty-state">
          <div className="blog-empty-state-title">No blog posts yet</div>
          <p className="blog-empty-state-text">
            Create your first blog post to get started.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Create your first post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      post.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {post.status}
                  </span>
                  <span className="font-medium text-[var(--color-text)] truncate">
                    {post.title}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                  /blog/{post.slug}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleStatusToggle(post)}
                  className="rounded px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                >
                  {post.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => setEditingPostId(post.id)}
                  className="rounded px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
