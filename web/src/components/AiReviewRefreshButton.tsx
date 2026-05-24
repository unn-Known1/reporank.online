"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  owner: string;
  name: string;
};

export default function AiReviewRefreshButton({ owner, name }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repo/${owner}/${name}/refresh-ai`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to refresh AI analysis");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <button
        onClick={handleRefresh}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-all duration-200 hover:bg-[var(--color-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Refreshing...
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5 transition-transform duration-300 hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </>
        )}
      </button>
      {error && <span className="text-xs text-danger-600 dark:text-danger-500">{error}</span>}
    </span>
  );
}
