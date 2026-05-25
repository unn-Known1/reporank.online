"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { DashboardItem } from "@/lib/db/db-schema";
import type { UserRepoCard } from "@/app/api/user/repos/route";
import { supabaseBrowser } from "@/lib/supabase/client";
import WatchlistItem from "./WatchlistItem";
import TrendingView from "./TrendingView";
import GitHubRepoCard, { GitHubRepoCardSkeleton } from "./GitHubRepoCard";
import { SkeletonCard } from "./Skeleton";

type Props = {
  initialItems: DashboardItem[];
  userId: string;
};

type SortOption = "pushed" | "stars" | "score-desc" | "score-asc";
type StatusFilter = "all" | "scored" | "unscored" | "needs-review" | "watchlisted";

export default function DashboardView({ initialItems, userId }: Props) {
  const [items, setItems] = useState<DashboardItem[]>(initialItems);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"watchlist" | "your-repos" | "discover">("watchlist");

  // Your Repos state
  const [userRepos, setUserRepos] = useState<UserRepoCard[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("pushed");

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

  const fetchUserRepos = useCallback(async () => {
    setReposLoading(true);
    setReposError(null);
    setScopeError(false);

    try {
      const res = await fetch("/api/user/repos");
      const data = await res.json();

      if (data.scope_error) {
        setScopeError(true);
        setUserRepos([]);
      } else if (res.ok) {
        setUserRepos(data.repos ?? []);
        setLastSynced(new Date());
      } else {
        setReposError(data.error || "Could not load your repos.");
      }
    } catch {
      setReposError("Could not load your repos. Please try again.");
    } finally {
      setReposLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "your-repos" && userRepos.length === 0 && !reposLoading && !reposError && !scopeError) {
      fetchUserRepos();
    }
  }, [activeTab, userRepos.length, reposLoading, reposError, scopeError, fetchUserRepos]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const r of userRepos) {
      if (r.language) set.add(r.language);
    }
    return Array.from(set).sort();
  }, [userRepos]);

  const filteredRepos = useMemo(() => {
    let result = [...userRepos];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.fullName.toLowerCase().includes(q));
    }

    // Language
    if (languageFilter) {
      result = result.filter((r) => r.language === languageFilter);
    }

    // Status
    switch (statusFilter) {
      case "scored":
        result = result.filter((r) => r.totalScore !== null);
        break;
      case "unscored":
        result = result.filter((r) => r.totalScore === null);
        break;
      case "needs-review":
        result = result.filter((r) => r.reviewCount === 0);
        break;
      case "watchlisted":
        result = result.filter((r) => r.isInWatchlist);
        break;
    }

    // Sort
    switch (sortOption) {
      case "stars":
        result.sort((a, b) => b.stars - a.stars);
        break;
      case "score-desc":
        result.sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));
        break;
      case "score-asc":
        result.sort((a, b) => (a.totalScore ?? -1) - (b.totalScore ?? -1));
        break;
      case "pushed":
      default:
        result.sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime());
        break;
    }

    return result;
  }, [userRepos, searchQuery, languageFilter, statusFilter, sortOption]);

  const scoredCount = useMemo(() => userRepos.filter((r) => r.totalScore !== null).length, [userRepos]);
  const needsReviewCount = useMemo(() => userRepos.filter((r) => r.reviewCount === 0).length, [userRepos]);

  const handleWatchlistToggle = useCallback((fullName: string, newState: boolean) => {
    setUserRepos((prev) =>
      prev.map((r) => (r.fullName === fullName ? { ...r, isInWatchlist: newState } : r))
    );
  }, []);

  const handleScoreNow = useCallback((fullName: string) => {
    fetchUserRepos();
  }, [fetchUserRepos]);

  if (items.length === 0 && !loading && activeTab === "watchlist") {
    return (
      <div>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "watchlist" && (
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
        )}
      </div>
    );
  }

  return (
    <div>
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

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

      {activeTab === "your-repos" && (
        <YourReposTab
          repos={filteredRepos}
          loading={reposLoading}
          error={reposError}
          scopeError={scopeError}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          languageFilter={languageFilter}
          onLanguageChange={setLanguageFilter}
          languages={languages}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortOption={sortOption}
          onSortChange={setSortOption}
          onRefresh={fetchUserRepos}
          lastSynced={lastSynced}
          totalCount={userRepos.length}
          scoredCount={scoredCount}
          needsReviewCount={needsReviewCount}
          onWatchlistToggle={handleWatchlistToggle}
          onScoreNow={handleScoreNow}
        />
      )}

      {activeTab === "discover" && <TrendingView />}
    </div>
  );
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: "watchlist" | "your-repos" | "discover") => void;
}) {
  const tabs = [
    { key: "watchlist", label: "Watchlist" },
    { key: "your-repos", label: "Your Repos" },
    { key: "discover", label: "Discover" },
  ] as const;

  return (
    <div className="mb-6 flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === tab.key
              ? "bg-[var(--color-text)] text-[var(--color-canvas)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Your Repos Tab ──────────────────────────────────────────────────────────

function YourReposTab({
  repos,
  loading,
  error,
  scopeError,
  searchQuery,
  onSearchChange,
  languageFilter,
  onLanguageChange,
  languages,
  statusFilter,
  onStatusChange,
  sortOption,
  onSortChange,
  onRefresh,
  lastSynced,
  totalCount,
  scoredCount,
  needsReviewCount,
  onWatchlistToggle,
  onScoreNow,
}: {
  repos: UserRepoCard[];
  loading: boolean;
  error: string | null;
  scopeError: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  languageFilter: string;
  onLanguageChange: (v: string) => void;
  languages: string[];
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  sortOption: SortOption;
  onSortChange: (v: SortOption) => void;
  onRefresh: () => void;
  lastSynced: Date | null;
  totalCount: number;
  scoredCount: number;
  needsReviewCount: number;
  onWatchlistToggle: (fullName: string, newState: boolean) => void;
  onScoreNow: (fullName: string) => void;
}) {
  if (scopeError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
        <svg className="mx-auto h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        <h2 className="mt-4 font-display text-lg font-semibold text-[var(--color-text)]">
          GitHub session expired
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your GitHub session has expired or lacks the required scope. Please sign in again to sync your repos.
        </p>
        <button
          onClick={() => {
            const supabase = supabaseBrowser();
            const redirectTo = `${window.location.origin}/auth/callback`;
            document.cookie = `auth_origin=${window.location.origin}; path=/; max-age=300; SameSite=Lax`;
            supabase.auth.signInWithOAuth({
              provider: "github",
              options: { redirectTo, scopes: "read:user public_repo" },
            });
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)]"
        >
          Sign in with GitHub
        </button>
      </div>
    );
  }

  if (error && repos.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
        <svg className="mx-auto h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.007v.008H12v-.008z" />
        </svg>
        <h2 className="mt-4 font-display text-lg font-semibold text-[var(--color-text)]">
          Could not load repos
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GitHubRepoCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
        <svg className="mx-auto h-10 w-10 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
        <h2 className="mt-4 font-display text-lg font-semibold text-[var(--color-text)]">
          No public repos found
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          We couldn&rsquo;t find any public GitHub repositories for your account. Create your first public repo on GitHub to get started.
        </p>
        <a
          href="https://github.com/new"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)]"
        >
          Create a repo
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Needs-review banner */}
      {needsReviewCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/5">
          <p className="text-sm text-amber-800 dark:text-amber-400">
            You have <strong>{needsReviewCount}</strong> {needsReviewCount === 1 ? "repo" : "repos"} with no community reviews yet.{" "}
            Help the community by being the first to review!
          </p>
        </div>
      )}

      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
          <span><strong className="text-[var(--color-text)]">{totalCount}</strong> repos</span>
          <span><strong className="text-[var(--color-text)]">{scoredCount}</strong> scored</span>
          <span className={needsReviewCount > 0 ? "text-amber-600 dark:text-amber-500" : ""}>
            <strong>{needsReviewCount}</strong> {needsReviewCount === 1 ? "needs" : "need"} reviews
          </span>
          {lastSynced && (
            <span className="font-mono text-[10px]">
              Synced {Math.floor((Date.now() - lastSynced.getTime()) / 60000)}m ago
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
        >
          <svg className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search repos..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Language */}
        <select
          value={languageFilter}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="">All languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="all">All</option>
          <option value="scored">Scored</option>
          <option value="unscored">Unscored</option>
          <option value="needs-review">Needs Review</option>
          <option value="watchlisted">Watchlisted</option>
        </select>

        {/* Sort */}
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="pushed">Recently Pushed</option>
          <option value="stars">Most Stars</option>
          <option value="score-desc">Score: High to Low</option>
          <option value="score-asc">Score: Low to High</option>
        </select>
      </div>

      {/* Repo grid */}
      {repos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No repos match your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => (
            <GitHubRepoCard
              key={repo.fullName}
              repo={repo}
              onWatchlistToggle={onWatchlistToggle}
              onScoreNow={onScoreNow}
            />
          ))}
        </div>
      )}
    </div>
  );
}
