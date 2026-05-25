"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  owner: string;
  name: string;
};

const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 5000;

export default function AiAnalysisPending({ owner, name }: Props) {
  const router = useRouter();
  const retries = useRef(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (retries.current >= MAX_RETRIES) {
        clearInterval(interval);
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

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
        <svg className="h-5 w-5 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">AI analysis is being generated</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">This usually takes a few seconds — the page will update automatically.</p>
      </div>
    </div>
  );
}
