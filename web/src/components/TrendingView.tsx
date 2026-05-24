"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SkeletonCard } from "@/components/Skeleton";

type TrendingRepo = {
  repo_id: string;
  full_name: string;
  owner: string;
  name: string;
  language: string | null;
  stars: number;
  total_score: number;
  score_velocity: number;
  computed_at: string;
  generated_at: string;
};

const LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust",
  "Java", "Ruby", "C", "C++", "Kotlin", "Swift", "PHP",
];

export default function TrendingView() {
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string | null>(null);
  const [sort, setSort] = useState<"trending" | "top_rated">("trending");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    params.set("sort", sort);

    fetch(`/api/user/trending?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setRepos(data.repos ?? []))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false));
  }, [language, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Language</label>
          <select
            value={language ?? ""}
            onChange={(e) => setLanguage(e.target.value || null)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
          >
            <option value="">All</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Sort</label>
          <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
            <button
              onClick={() => setSort("trending")}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                sort === "trending"
                  ? "bg-[var(--color-text)] text-[var(--color-canvas)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setSort("top_rated")}
              className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                sort === "top_rated"
                  ? "bg-[var(--color-text)] text-[var(--color-canvas)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              Top Rated
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : repos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No trending repos found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.repo_id}
              onClick={() => router.push(`/github/${repo.owner}/${repo.name}`)}
              className="group cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-elevated)] hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-500">
                    {repo.owner.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      <span className="text-[var(--color-text-muted)]">{repo.owner}/</span>
                      <span>{repo.name}</span>
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      {repo.language && (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                          {repo.language}
                        </span>
                      )}
                      <span>{repo.stars.toLocaleString()} stars</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-[var(--color-text)]">
                      {repo.total_score}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                      {repo.score_velocity.toFixed(1)}
                    </span>
                  </div>
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
          ))}
        </div>
      )}
    </div>
  );
}
