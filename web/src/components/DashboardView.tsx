"use client";

import { useState, useEffect } from "react";
import type { DashboardItem } from "@/lib/db/db-schema";
import WatchlistItem from "./WatchlistItem";
import TrendingView from "./TrendingView";
import { SkeletonCard } from "@/components/Skeleton";

type Props = {
  initialItems: DashboardItem[];
  userId: string;
};

export default function DashboardView({ initialItems, userId }: Props) {
  const [items, setItems] = useState<DashboardItem[]>(initialItems);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"watchlist" | "discover">("watchlist");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/user/dashboard");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
        }
      } catch {
        // keep initial items on error
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (items.length === 0 && !loading) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)]">
          <svg className="h-6 w-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
          No watched repos yet
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Search for a GitHub repository and click &ldquo;Add to Watchlist&rdquo; to start tracking.
        </p>
        <a
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)]"
        >
          Search repos
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1">
        <button
          onClick={() => setActiveTab("watchlist")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === "watchlist"
              ? "bg-[var(--color-text)] text-[var(--color-canvas)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          Watchlist
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === "discover"
              ? "bg-[var(--color-text)] text-[var(--color-canvas)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          Discover
        </button>
      </div>

      {activeTab === "watchlist" && (
        <div>
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <WatchlistItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "discover" && <TrendingView />}
    </div>
  );
}
