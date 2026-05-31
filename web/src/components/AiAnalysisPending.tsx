"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Props = {
  owner: string;
  name: string;
};

const MAX_RETRIES = 24;
const POLL_INTERVAL_MS = 5000;

export default function AiAnalysisPending({ owner, name }: Props) {
  const router = useRouter();
  const retries = useRef(0);
  const [pollingStopped, setPollingStopped] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (retries.current >= MAX_RETRIES) {
        clearInterval(interval);
        setPollingStopped(true);
        return;
      }
      retries.current += 1;
      try {
        const res = await fetch(`/api/repo/${owner}/${name}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.ai_review) {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // silently retry
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [owner, name, router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/repo/${owner}/${name}/refresh-ai`, { method: "POST" });
      if (res.ok || res.status === 409) {
        retries.current = 0;
        setPollingStopped(false);
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [owner, name]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
        <svg className={`h-5 w-5 text-[var(--color-primary)] ${pollingStopped ? "" : "animate-spin"}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">
          {pollingStopped ? "AI analysis is taking longer than expected" : "AI analysis is being generated"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {pollingStopped
            ? "This can happen when the AI provider is busy. Try again or check back later."
            : "The page will update automatically once ready."}
        </p>
      </div>
      {pollingStopped && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-xs font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface)] disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Requesting...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Try again
            </>
          )}
        </button>
      )}
    </div>
  );
}
