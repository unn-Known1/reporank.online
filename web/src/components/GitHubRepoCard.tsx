"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { UserRepoCard } from "@/app/api/user/repos/route";

type Props = {
  repo: UserRepoCard;
  onWatchlistToggle?: (fullName: string, newState: boolean) => void;
  onScoreNow?: (fullName: string) => void;
};

function getGrade(score: number) {
  if (score >= 85) return { letter: "A", color: "text-emerald-500" };
  if (score >= 70) return { letter: "B", color: "text-cyan-500" };
  if (score >= 50) return { letter: "C", color: "text-amber-500" };
  if (score >= 30) return { letter: "D", color: "text-orange-500" };
  return { letter: "F", color: "text-rose-500" };
}

function getVerdictChip(verdict: string | null) {
  switch (verdict) {
    case "RECOMMENDED":
      return { label: "RECOMMENDED", classes: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400" };
    case "CAUTION":
      return { label: "CAUTION", classes: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-500" };
    case "NOT_RECOMMENDED":
      return { label: "NOT RECOMMENDED", classes: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-500" };
    default:
      return { label: "No AI review", classes: "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" };
  }
}

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const gradeInfo = getGrade(clamped);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * clamped) / 100;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[var(--color-border)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${gradeInfo.color}`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className={`absolute text-xs font-bold ${gradeInfo.color}`}>
        {gradeInfo.letter}
      </span>
    </div>
  );
}

function ScorePlaceholder({ size = 48 }: { size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[var(--color-border)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          className="text-[var(--color-border)] opacity-40"
        />
      </svg>
      <span className="text-[9px] font-semibold text-[var(--color-text-muted)]">&mdash;</span>
    </div>
  );
}

export function GitHubRepoCardSkeleton() {
  return (
    <div className="animate-shimmer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      style={{ background: "linear-gradient(90deg, var(--color-surface) 0%, var(--color-surface-elevated) 50%, var(--color-surface) 100%)", backgroundSize: "200% 100%" }}
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-[var(--color-border)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--color-border)]" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-[var(--color-border)]" />
        <div className="h-3 w-2/3 rounded bg-[var(--color-border)]" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-[var(--color-border)]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 rounded bg-[var(--color-border)]" />
          <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}

export default function GitHubRepoCard({ repo, onWatchlistToggle, onScoreNow }: Props) {
  const router = useRouter();
  const [watchlisted, setWatchlisted] = useState(repo.isInWatchlist);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [scoring, setScoring] = useState(false);

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [owner, name] = repo.fullName.split("/");
  const chip = getVerdictChip(repo.aiVerdict);
  const needsReview = repo.reviewCount === 0;
  const displayTopics = repo.topics.slice(0, 3);
  const extraTopics = repo.topics.length - 3;

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (watchlistLoading) return;
    setWatchlistLoading(true);

    const previous = watchlisted;
    const newState = !watchlisted;
    setWatchlisted(newState);

    try {
      const method = newState ? "POST" : "DELETE";
      const res = await fetch("/api/user/watchlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, name }),
      });
      if (!res.ok) {
        setWatchlisted(previous);
        if (res.status === 409) setWatchlisted(true);
      } else {
        onWatchlistToggle?.(repo.fullName, newState);
      }
    } catch {
      setWatchlisted(previous);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleScoreNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scoring) return;
    setScoring(true);

    try {
      const res = await fetch("/api/repo/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: repo.fullName }),
      });
      if (res.ok) {
        onScoreNow?.(repo.fullName);
      }
    } catch {
      // keep unscored state
    } finally {
      setScoring(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    router.push(`/github/${owner}/${name}`);
  };

  return (
    <div
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/github/${owner}/${name}`);
        }
      }}
      className="group cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--color-border-strong)]"
    >
      {/* Archived banner */}
      {repo.isArchived && (
        <div className="-mx-5 -mt-5 mb-4 rounded-t-xl bg-amber-50 px-5 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
          ARCHIVED
        </div>
      )}

      {/* Header: avatar + name + watchlist */}
      <div className="flex items-start gap-3">
        {avatarFailed ? (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[10px] font-bold text-[var(--color-primary)]">
            {repo.owner.charAt(0).toUpperCase()}
          </div>
        ) : (
          <Image
            src={repo.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 flex-shrink-0 rounded-lg"
            onError={() => setAvatarFailed(true)}
            unoptimized
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {needsReview && (
              <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" title="Needs reviews" />
            )}
            <span className="truncate text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
              {repo.owner} / {repo.name}
            </span>
          </div>
          {/* Meta row: stars, forks, language */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              {repo.stars.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              {repo.forks.toLocaleString()}
            </span>
            {repo.language && (
              <span className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: repo.languageColor || "#858585" }}
                />
                {repo.language}
              </span>
            )}
          </div>
        </div>

        {/* Watchlist toggle button */}
        <button
          onClick={handleWatchlistToggle}
          disabled={watchlistLoading}
          className={`flex-shrink-0 rounded-lg p-1.5 transition-all duration-200 ${
            watchlisted
              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
          }`}
          title={watchlisted ? "Remove from watchlist" : "Add to watchlist"}
          aria-label={watchlisted ? "Remove from watchlist" : "Add to watchlist"}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${watchlistLoading ? "animate-pulse" : ""}`}
            fill={watchlisted ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>

      {/* Description - 2 line clamp */}
      {repo.description && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-2">
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {displayTopics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {displayTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-md bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] border border-[var(--color-border)]"
            >
              {topic}
            </span>
          ))}
          {extraTopics > 0 && (
            <span className="text-[10px] text-[var(--color-text-muted)] self-center">
              +{extraTopics} more
            </span>
          )}
        </div>
      )}

      {/* Score section */}
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-[var(--color-surface-elevated)] p-3 border border-[var(--color-border)]">
        {repo.totalScore !== null ? (
          <>
            <ScoreRing score={repo.totalScore} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  Score {repo.totalScore}
                </span>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${chip.classes}`}>
                  {chip.label}
                </span>
              </div>
              {repo.computedAt && (
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  {daysAgo(repo.computedAt)}
                </span>
              )}
            </div>
          </>
        ) : scoring ? (
          <>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-[var(--color-text-secondary)]">Scoring...</span>
            </div>
          </>
        ) : (
          <>
            <ScorePlaceholder />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--color-text-muted)]">Not scored yet</div>
              <button
                onClick={handleScoreNow}
                className="mt-1 inline-flex items-center gap-1 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)] transition-all duration-200 hover:bg-[var(--color-primary)]/20"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Score Now
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          <span className="text-xs text-[var(--color-text-muted)]">
            {repo.reviewCount} {repo.reviewCount === 1 ? "review" : "reviews"}
          </span>
        </div>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
          Pushed {daysAgo(repo.pushedAt)}
        </span>
      </div>

      {/* Write a Review link — shown for any repo with 0 reviews */}
      {needsReview && (
        <div className="mt-2">
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500">
            No reviews yet &middot;{" "}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/github/${owner}/${name}`);
              }}
              className="underline decoration-dotted hover:decoration-solid cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
            >
              Write a review
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
