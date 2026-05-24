"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import ReviewsList from "@/components/ReviewsList";
import ReviewForm from "@/components/ReviewForm";

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
  repoId: string;
  owner: string;
  name: string;
};

export default function ReviewSection({ repoId, owner, name }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        setUserId(data?.session?.user?.id ?? null);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/repo/${owner}/${name}?reviews_page=1&reviews_limit=5`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setTotalReviews(data.total_reviews ?? 0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [owner, name, retryCount]);

  function handleRetry() {
    setRetryCount((c) => c + 1);
  }

  async function handleLoadMore() {
    setLoading(true);
    setPage((prev) => {
      const nextPage = prev + 1;
      fetchMore(owner, name, nextPage);
      return nextPage;
    });
  }

  async function fetchMore(owner: string, name: string, pageNum: number) {
    try {
      const res = await fetch(`/api/repo/${owner}/${name}?reviews_page=${pageNum}&reviews_limit=5`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      setTotalReviews(data.total_reviews ?? 0);
    } catch {
      // silently fail
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
          <button onClick={handleRetry} className="mt-2 text-sm text-[var(--color-primary)] hover:underline rounded">
            Retry
          </button>
        </div>
      )}

      {mounted && loading && reviews.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading reviews...
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
          <div className="relative">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <button
                className="inline font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
                onClick={handleSignIn}
              >
                Sign in with GitHub
              </button>{" "}
              to leave a review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
