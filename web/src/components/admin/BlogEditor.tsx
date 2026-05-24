"use client";

import { useState, useCallback } from "react";
import RepoAutocomplete from "@/components/admin/RepoAutocomplete";
import CategorySelect from "@/components/admin/CategorySelect";

interface BlogPostForm {
  title: string;
  body: string;
  excerpt: string;
  slug: string;
  seo_meta_title: string;
  seo_meta_description: string;
  status: "draft" | "published";
  category_id: string | null;
  repos: { owner: string; name: string }[];
}

interface BlogEditorProps {
  initialData?: Partial<BlogPostForm>;
  postId?: string;
  onSaved?: () => void;
}

export default function BlogEditor({ initialData, postId, onSaved }: BlogEditorProps) {
  const [form, setForm] = useState<BlogPostForm>({
    title: initialData?.title || "",
    body: initialData?.body || "",
    excerpt: initialData?.excerpt || "",
    slug: initialData?.slug || "",
    seo_meta_title: initialData?.seo_meta_title || "",
    seo_meta_description: initialData?.seo_meta_description || "",
    status: initialData?.status || "draft",
    category_id: initialData?.category_id || null,
    repos: initialData?.repos || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof BlogPostForm>(
    field: K,
    value: BlogPostForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (publish: boolean) => {
    setSaving(true);
    setError(null);

    const status = publish ? "published" : "draft";
    const payload = { ...form, status };

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
        setError(data.error || "Failed to save");
        return;
      }

      onSaved?.();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }, [form, postId, onSaved]);

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
        <textarea
          value={form.body}
          onChange={(e) => updateField("body", e.target.value)}
          maxLength={100000}
          rows={16}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)] font-mono"
          placeholder="Write your post in Markdown..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Excerpt
        </label>
        <textarea
          value={form.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)]"
          placeholder="Short description for listings and SEO"
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

        <CategorySelect
          value={form.category_id}
          onChange={(v) => updateField("category_id", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            SEO Meta Title
          </label>
          <input
            type="text"
            value={form.seo_meta_title}
            onChange={(e) => updateField("seo_meta_title", e.target.value)}
            maxLength={70}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)]"
            placeholder="Overrides title in search results (max 70)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            SEO Meta Description
          </label>
          <input
            type="text"
            value={form.seo_meta_description}
            onChange={(e) => updateField("seo_meta_description", e.target.value)}
            maxLength={160}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)]"
            placeholder="Overrides excerpt in search results (max 160)"
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
