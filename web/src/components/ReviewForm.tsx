"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIMENSIONS = [
  { key: "code_quality", label: "Code Quality" },
  { key: "docs", label: "Documentation" },
  { key: "maintenance", label: "Maintenance" },
  { key: "ease_of_use", label: "Ease of Use" },
  { key: "security", label: "Security" },
];

export default function ReviewForm({ repoId, owner, name }: { repoId: string; owner: string; name: string }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const ratedDims = Object.keys(ratings).filter((k) => ratings[k] > 0);
    if (ratedDims.length === 0) {
      setError("Please rate at least one dimension.");
      return;
    }
    const trimmedBody = body.trim();
    if (trimmedBody.length < 50) {
      setError("Review must be at least 50 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/repo/${owner}/${name}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings, body }),
      });

      if (res.status === 401) {
        setError("Please sign in to submit a review.");
        return;
      }
      if (res.status === 400) {
        const data = await res.json();
        setError(data?.error ?? "Review could not be submitted.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      router.refresh();
      setRatings({});
      setBody("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const ratingCount = Object.keys(ratings).filter((k) => ratings[k] > 0).length;

  return (
    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm" data-testid="review-form">
      <h3 className="font-display text-base font-bold text-[var(--color-text)]">Leave a review</h3>

      <div className="mt-5 space-y-4">
        {DIMENSIONS.map((dim) => {
          const rating = ratings[dim.key] ?? 0;
          return (
            <div key={dim.key}>
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">{dim.label}</label>
              <div className="mt-2 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    data-testid={`star-${dim.key}-${star}`}
                    onClick={() => setRatings((r) => ({ ...r, [dim.key]: star }))}
                    className={`relative h-10 w-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      rating >= star
                        ? "bg-amber-500 text-white shadow-sm"
                        : "border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Your experience</label>
          <span className={`text-xs font-mono ${body.trim().length < 50 ? "text-[var(--color-text-muted)]" : "text-emerald-600 dark:text-emerald-400"}`}>
            {body.trim().length}/50 min
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What stood out? Share your experience using this library..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
          rows={4}
          data-testid="review-body"
        />
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-danger-500/20 bg-danger-500/10 px-4 py-3" role="alert">
          <svg className="h-4 w-4 flex-shrink-0 text-danger-600 dark:text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-danger-600 dark:text-danger-500">{error}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">
          {ratingCount > 0 ? `${ratingCount} dimension${ratingCount > 1 ? "s" : ""} rated` : "Rate at least one dimension"}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="relative overflow-hidden rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50 shadow-sm"
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </form>
  );
}
