"use client";

import { useState, useCallback, useEffect } from "react";
import RepoAutocomplete from "@/components/admin/RepoAutocomplete";

interface BlogPostForm {
  title: string;
  body: string;
  excerpt: string;
  slug: string;
  status: "draft" | "published";
  repos: { owner: string; name: string }[];
  tags: string;
}

interface UserBlogEditorProps {
  initialData?: Partial<BlogPostForm> & { tags?: string[] };
  postId?: string;
  onSaved?: () => void;
}

export default function UserBlogEditor({ initialData, postId, onSaved }: UserBlogEditorProps) {
  const [form, setForm] = useState<BlogPostForm>({
    title: initialData?.title || "",
    body: initialData?.body || "",
    excerpt: initialData?.excerpt || "",
    slug: initialData?.slug || "",
    status: initialData?.status || "draft",
    repos: initialData?.repos || [],
    tags: (initialData as any)?.tags?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const hasContent = form.title.trim() || form.body.trim();

  useEffect(() => {
    if (!hasContent) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasContent]);

  const updateField = useCallback(<K extends keyof BlogPostForm>(
    field: K,
    value: BlogPostForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "body") {
      setWordCount((value as string).split(/\s+/).filter(Boolean).length);
    }
  }, []);

  const handleSave = useCallback(async (publish: boolean) => {
    setSaving(true);
    setError(null);

    const status = publish ? "published" : "draft";

    const tags = form.tags
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
      .filter(Boolean);

    const payload = {
      title: form.title,
      body: form.body,
      excerpt: form.excerpt || undefined,
      slug: form.slug || undefined,
      status,
      repos: form.repos,
      tags,
    };

    try {
      const url = postId ? `/api/blog/posts/${postId}` : "/api/blog/posts";
      const method = postId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (data.errors?.[0]?.message ?? "Failed to save"));
        return;
      }

      onSaved?.();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }, [form, postId, onSaved]);

  const wordCountWarning = wordCount > 0 && wordCount < 100;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Title *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          maxLength={200}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)]"
          placeholder="Post title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Body (Markdown) *
        </label>
        <div className="relative">
          <textarea
            value={form.body}
            onChange={(e) => updateField("body", e.target.value)}
            maxLength={100000}
            rows={16}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)] font-mono"
            placeholder="Write your post in Markdown..."
          />
          <div className="absolute bottom-2 right-2 text-xs text-[var(--color-text-muted)]">
            {wordCount} words
            {wordCountWarning && (
              <span className="ml-2 text-amber-500">(aim for 200+ words)</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Excerpt
        </label>
        <textarea
          value={form.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)]"
          placeholder="Short description for listings (auto-generated from body if empty)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Slug
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)]"
            placeholder="Auto-generated from title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)]"
            placeholder="react, typescript, tutorial"
          />
        </div>
      </div>

      <RepoAutocomplete
        selected={form.repos}
        onAdd={(repo) => updateField("repos", [...form.repos, repo])}
        onRemove={(i) => updateField("repos", form.repos.filter((_, idx) => idx !== i))}
      />

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
