"use client";

import { useRouter } from "next/navigation";
import type { DashboardItem } from "@/lib/db/db-schema";
import ScoreDelta from "./ScoreDelta";

type Props = {
  item: DashboardItem;
};

export default function WatchlistItem({ item }: Props) {
  const router = useRouter();
  const repoUrl = `/github/${item.owner}/${item.name}`;

  return (
    <div
      onClick={() => router.push(repoUrl)}
      className="group cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-elevated)] hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
            {item.owner.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--color-text)]">
              <span className="text-[var(--color-text-muted)]">{item.owner}/</span>
              <span>{item.name}</span>
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              {item.language && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                  {item.language}
                </span>
              )}
              <span>{item.stars.toLocaleString()} stars</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {item.total_score !== null && (
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
                {item.total_score}
              </p>
              {item.score_delta !== null && (
                <ScoreDelta delta={item.score_delta} direction={item.delta_direction} />
              )}
            </div>
          )}
          {item.total_score === null && (
            <span className="text-xs text-[var(--color-text-muted)]">No score</span>
          )}
          <svg
            className="h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
