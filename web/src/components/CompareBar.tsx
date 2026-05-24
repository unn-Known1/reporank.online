"use client";

import { useComparison } from "@/lib/comparison-context";
import { useRouter } from "next/navigation";

export default function CompareBar() {
  const ctx = useComparison();
  const router = useRouter();

  if (!ctx) return null;
  const { selectedRepos, clearAll, count } = ctx;

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 shadow-lg backdrop-blur-xl">
        <span className="text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text)]">{count}</strong> repo{count !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={() => router.push(`/compare?compare=${selectedRepos.map((r) => r.fullName).join(",")}`)}
          disabled={count < 2}
          className="rounded-lg bg-[var(--color-text)] px-4 py-1.5 text-sm font-medium text-[var(--color-canvas)] transition-all duration-200 hover:opacity-90 disabled:opacity-50"
        >
          Compare
        </button>
        <button
          onClick={clearAll}
          className="text-xs text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text)]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
