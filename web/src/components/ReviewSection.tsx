"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import ReviewsList from "@/components/ReviewsList";
import ReviewForm from "@/components/ReviewForm";
import type { Review } from "@/lib/db/reviews";

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

function toReviewRow(r: Review | ReviewRow): ReviewRow {
  if ("is_author" in r) return r as ReviewRow;
  const rev = r as Review;
  return {
    id: rev.id,
    repo_id: rev.repo_id,
    user_id: rev.user_id,
    user: rev.user ?? (rev.github_username ? { username: rev.github_username, avatar_url: `https://github.com/${rev.github_username}.png?size=40` } : null),
    ratings_json: rev.ratings_json as Record<string, number>,
    body: rev.body,
    created_at: rev.created_at,
    is_outdated: rev.is_outdated,
    spam_flagged: rev.spam_flagged,
    is_author: false,
  };
}

type Props = {
  repoId: string;
  owner: string;
  name: string;
  initialReviews?: Review[];
  initialTotal?: number;
};

export default function ReviewSection({ repoId, owner, name, initialReviews = [], initialTotal = 0 }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews.map(toReviewRow));
  const [page, setPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        setUserId(data?.session?.user?.id ?? null);
      });
  }, []);

  async function handleLoadMore() {
    setLoading(true);
    const nextPage = page + 1;
    setPage(nextPage);
    try {
      const res = await fetch(`/api/repo/${owner}/${name}?reviews_page=${nextPage}&reviews_limit=5`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      setTotalReviews(data.total_reviews ?? 0);
    } catch {
      setError("Failed to load more reviews");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.href },
    });
  }

  const hasMore = reviews.length < totalReviews;

  return (
    <div className="space-y-4">
      <ReviewsList reviews={reviews} userId={userId} />

      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-danger-600 dark:text-danger-500">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-sm text-[var(--color-primary)] hover:underline rounded">
            Dismiss
          </button>
        </div>
      )}

      {mounted && loading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading more...
          </div>
        </div>
      )}

      {!loading && hasMore && (
        <button
          onClick={handleLoadMore}
          className="group w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-surface)]"
        >
          <span className="inline-flex items-center gap-2">
            Load more
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              ({totalReviews - reviews.length} remaining)
            </span>
          </span>
        </button>
      )}

      {userId ? (
        <ReviewForm repoId={repoId} owner={owner} name={name} />
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 text-center" data-testid="sign-in-prompt">
          <div className="relative space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                <button
                  className="inline font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
                  onClick={handleSignIn}
                >
                  Sign in with GitHub
                </button>{" "}
                to share your experience.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Helpful reviews mention what you used the repo for, how it performed, and any issues you encountered.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
