"use client";

import { useState, useCallback, useMemo, useRef } from "react";

type ReviewRow = {
  id: string;
  repo_id: string;
  user_id: string;
  user: { username: string; avatar_url: string } | null;
  ratings_json: Record<string, number>;
  body: string;
  created_at: string;
  is_outdated: boolean;
  spam_flagged: boolean;
  is_author: boolean;
};

type Props = {
  reviews: ReviewRow[];
  userId?: string | null;
};

type SortKey = "newest" | "highest_rated" | "author_first";

const STANDARD_DIMENSIONS = new Set([
  "code_quality",
  "docs",
  "maintenance",
  "ease_of_use",
  "security",
]);

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 transition-colors duration-200 ${i < rating ? "fill-amber-500" : "fill-[var(--color-border-strong)]"}`}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function avgRating(ratings: Record<string, number>): number {
  const vals = Object.values(ratings);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "highest_rated", label: "Highest rated" },
  { key: "author_first", label: "Author first" },
];

export default function ReviewsList({ reviews, userId }: Props) {
  const [votes, setVotes] = useState<Record<string, "helpful" | "unhelpful">>({});
  const [showSpam, setShowSpam] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");

  const sorted = useMemo(() => {
    const list = [...reviews];
    switch (sort) {
      case "newest":
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "highest_rated":
        return list.sort((a, b) => avgRating(b.ratings_json) - avgRating(a.ratings_json));
      case "author_first":
        return list.sort((a, b) => {
          if (a.is_author !== b.is_author) return a.is_author ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }
  }, [reviews, sort]);

  const filtered = showSpam ? sorted : sorted.filter((r) => !r.spam_flagged);

  const votesRef = useRef(votes);
  votesRef.current = votes;

  const handleVote = useCallback(
    async (reviewId: string, vote: "helpful" | "unhelpful") => {
      if (!userId) return;
      const current = votesRef.current[reviewId];
      if (current === vote) return;
      setVotes((prev) => ({ ...prev, [reviewId]: vote }));
      try {
        const res = await fetch(`/api/review/${reviewId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) {
          setVotes((prev) => {
            const next = { ...prev };
            delete next[reviewId];
            return next;
          });
        }
      } catch {
        setVotes((prev) => {
          const next = { ...prev };
          delete next[reviewId];
          return next;
        });
      }
    },
    [userId]
  );

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
          <svg className="h-5 w-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          No reviews yet. Sign in with GitHub to be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {reviews.some((r) => r.spam_flagged) && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSpam}
              onChange={(e) => setShowSpam(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
            />
            <span className="text-xs text-[var(--color-text-muted)]">Show flagged reviews</span>
          </label>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <span className="text-[var(--color-text-muted)]">Sort by:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              aria-pressed={sort === opt.key}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all duration-200 ${
                sort === opt.key
                  ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.map((review, index) => (
        <div
          key={review.id}
          data-testid="review-card"
          role="article"
          className={`relative overflow-hidden rounded-xl border bg-[var(--color-surface)] p-4 shadow-sm transition-all duration-200 hover:shadow ${
            review.spam_flagged ? "opacity-50" : ""
          } ${review.is_author ? "border-[var(--color-primary)]/30" : "border-[var(--color-border)]"}`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="relative flex items-center gap-3">
            {review.user?.avatar_url && (
              <img
                src={review.user.avatar_url}
                alt={review.user.username ?? ""}
                className="h-9 w-9 rounded-lg"
              />
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {review.user?.username ?? "anonymous"}
              </span>
              {review.is_author && (
                <span className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                  Author
                </span>
              )}
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {review.is_outdated && (
                <span className="rounded-lg border border-warning-500/30 bg-warning-500/10 px-2.5 py-1 text-xs font-medium text-warning-600 dark:text-warning-500">
                  Outdated
                </span>
              )}
              {review.spam_flagged && (
                <span className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-2.5 py-1 text-xs font-medium text-danger-600 dark:text-danger-500">
                  Flagged
                </span>
              )}
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {Object.entries(review.ratings_json ?? {}).map(([dim, val]) => (
              <span key={dim} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="capitalize text-xs font-medium text-[var(--color-text-muted)]">{dim.replace(/_/g, " ")}</span>
                {STANDARD_DIMENSIONS.has(dim) ? (
                  <Stars rating={val} />
                ) : (
                  <span className="font-medium text-[var(--color-text)]">{val}/5</span>
                )}
              </span>
            ))}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{review.body}</p>

          <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
            <button
              onClick={() => handleVote(review.id, "helpful")}
              disabled={!userId}
              data-testid="vote-helpful"
              aria-label="Mark as helpful"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-200 ${
                votes[review.id] === "helpful"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
              } ${!userId ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
              </svg>
              Helpful
            </button>
            <button
              onClick={() => handleVote(review.id, "unhelpful")}
              disabled={!userId}
              data-testid="vote-unhelpful"
              aria-label="Mark as unhelpful"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-200 ${
                votes[review.id] === "unhelpful"
                  ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-500"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
              } ${!userId ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 001.302-4.665c0-1.194-.232-2.333-.654-3.375zM3.75 12h.008v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Unhelpful
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
