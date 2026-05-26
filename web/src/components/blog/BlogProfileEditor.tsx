"use client";

import { useState, useCallback, useEffect } from "react";

interface BlogProfile {
  display_name: string;
  bio: string;
  github_url: string;
  website_url: string;
}

export default function BlogProfileEditor({ onSaved }: { onSaved?: () => void }) {
  const [profile, setProfile] = useState<BlogProfile>({ display_name: "", bio: "", github_url: "", website_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/blog-profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profile) {
          setProfile({
            display_name: data.profile.display_name ?? "",
            bio: data.profile.bio ?? "",
            github_url: data.profile.github_url ?? "",
            website_url: data.profile.website_url ?? "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/user/blog-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSuccess(true);
        onSaved?.();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || data.errors?.[0] || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }, [profile, onSaved]);

  if (loading) {
    return <div className="h-20 animate-pulse rounded bg-[var(--color-surface-elevated)]" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">Author Profile</h3>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">Profile saved</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Display Name</label>
          <input
            type="text"
            value={profile.display_name}
            onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
            maxLength={60}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm text-[var(--color-text)]"
            placeholder="Your display name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">GitHub URL</label>
          <input
            type="url"
            value={profile.github_url}
            onChange={(e) => setProfile((p) => ({ ...p, github_url: e.target.value }))}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm text-[var(--color-text)]"
            placeholder="https://github.com/username"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm text-[var(--color-text)]"
            placeholder="Short bio for your author profile"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Website URL</label>
          <input
            type="url"
            value={profile.website_url}
            onChange={(e) => setProfile((p) => ({ ...p, website_url: e.target.value }))}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm text-[var(--color-text)]"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
