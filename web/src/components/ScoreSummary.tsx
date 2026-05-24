"use client";
import { useState, useEffect } from "react";
import React from "react";
import type { SubScores } from "@reporank/core";

type SubScoreKey = keyof SubScores;

type Props = {
  total: number;
  subscores: Record<string, number>;
  weights?: Partial<Record<SubScoreKey, number>> | null;
  computedAt?: string | null;
  repo?: {
    stars: number;
    forks: number;
    language: string;
  };
};

const WEIGHT_LABELS: Record<string, number> = {
  maintenance: 30,
  community: 25,
  security: 20,
  documentation: 15,
  adoption: 10,
};

const DEFAULT_WEIGHTS: Record<SubScoreKey, number> = {
  maintenance: 0.30,
  community: 0.25,
  security: 0.20,
  documentation: 0.15,
  adoption: 0.10,
};

function getScoreInfo(score: number) {
  if (score >= 85) {
    return {
      label: "Excellent",
      gradient: "from-emerald-400 to-cyan-400",
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-500/10",
      borderAccent: "border-emerald-200 dark:border-emerald-500/30",
      gradientFrom: "#34d399",
      gradientTo: "#06b6d4",
    };
  }
  if (score >= 70) {
    return {
      label: "Good",
      gradient: "from-emerald-400 to-cyan-400",
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-500/10",
      borderAccent: "border-emerald-200 dark:border-emerald-500/30",
      gradientFrom: "#34d399",
      gradientTo: "#06b6d4",
    };
  }
  if (score >= 50) {
    return {
      label: "Fair",
      gradient: "from-amber-400 to-orange-400",
      accent: "text-amber-600 dark:text-amber-400",
      bgAccent: "bg-amber-50 dark:bg-amber-500/10",
      borderAccent: "border-amber-200 dark:border-amber-500/30",
      gradientFrom: "#fbbf24",
      gradientTo: "#f97316",
    };
  }
  if (score >= 30) {
    return {
      label: "Weak",
      gradient: "from-amber-400 to-orange-400",
      accent: "text-amber-600 dark:text-amber-400",
      bgAccent: "bg-amber-50 dark:bg-amber-500/10",
      borderAccent: "border-amber-200 dark:border-amber-500/30",
      gradientFrom: "#fbbf24",
      gradientTo: "#f97316",
    };
  }
  return {
    label: "Poor",
    gradient: "from-rose-400 to-red-400",
    accent: "text-rose-600 dark:text-rose-400",
    bgAccent: "bg-rose-50 dark:bg-rose-500/10",
    borderAccent: "border-rose-200 dark:border-rose-500/30",
    gradientFrom: "#fb7185",
    gradientTo: "#e11d48",
  };
}

function getGrade(score: number) {
  if (score >= 85) return { letter: "A", color: "text-emerald-500", bg: "bg-emerald-500" };
  if (score >= 70) return { letter: "B", color: "text-cyan-500", bg: "bg-cyan-500" };
  if (score >= 50) return { letter: "C", color: "text-amber-500", bg: "bg-amber-500" };
  if (score >= 30) return { letter: "D", color: "text-orange-500", bg: "bg-orange-500" };
  return { letter: "F", color: "text-rose-500", bg: "bg-rose-500" };
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SubScoreItem = React.memo(function SubScoreItem({
  keyName,
  value,
  index,
  revealed,
}: {
  keyName: string;
  value: number;
  index: number;
  revealed: boolean;
}) {
  const isUnscored = value === 0;
  const info = isUnscored ? {
    label: "Unscored",
    gradient: "from-slate-400 to-slate-500",
    accent: "text-[var(--color-text-muted)]",
    bgAccent: "bg-[var(--color-surface)]",
    borderAccent: "border-[var(--color-border)]",
    gradientFrom: "#94a3b8",
    gradientTo: "#64748b",
  } : getScoreInfo(value);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 transition-all duration-300 hover:border-[var(--color-border-strong)]"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(8px)",
        transitionDelay: `${200 + index * 80}ms`,
      }}
      title={isUnscored ? "No data available for this metric" : `${keyName}: ${value}/100 — ${info.label}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {keyName}
        </span>
        <span className={`font-display text-xl font-bold whitespace-nowrap ${info.accent}`}>
          {isUnscored ? <span className="opacity-40">&mdash;</span> : value}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${info.gradient} transition-all duration-1000 ease-out`}
          style={{
            width: revealed ? `${value}%` : "0%",
            transitionDelay: `${400 + index * 80}ms`,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[9px] text-[var(--color-text-muted)]">Weight</span>
        <span className="text-[10px] font-mono font-semibold text-[var(--color-text-secondary)]">
          {WEIGHT_LABELS[keyName] ?? 0}%
        </span>
      </div>
    </div>
  );
});

export default function ScoreSummary({
  total,
  subscores,
  weights,
  computedAt,
  repo,
}: Props) {
  const hasCustomWeights = weights !== null && weights !== undefined;
  const [mounted, setMounted] = useState(false);

  let displayTotal = total;
  if (hasCustomWeights || total === 0) {
    const activeWeights = hasCustomWeights ? weights : DEFAULT_WEIGHTS;
    displayTotal = Math.round(
      (Object.keys(DEFAULT_WEIGHTS) as SubScoreKey[]).reduce((sum, key) => {
        const sub = (subscores as Record<string, number>)[key] ?? 0;
        const w = activeWeights?.[key] ?? DEFAULT_WEIGHTS[key];
        return sum + sub * w;
      }, 0)
    );
  }

  const [animatedScore, setAnimatedScore] = useState(displayTotal);
  const [revealed, setRevealed] = useState(true);

  const scoreInfo = getScoreInfo(displayTotal);
  const gradeInfo = getGrade(displayTotal);

  useEffect(() => {
    setMounted(true);
    setAnimatedScore(0);
    setRevealed(false);
  }, []);

  useEffect(() => {
    const target = displayTotal;
    const duration = 1200;
    const startTime = performance.now();
    let rafId: number;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setAnimatedScore(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setRevealed(true);
      }
    }

    const timeout = setTimeout(() => {
      rafId = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
    };
  }, [displayTotal]);

  const circumference = 2 * Math.PI * 56;
  const strokeDashoffset = revealed
    ? circumference - (circumference * animatedScore) / 100
    : circumference;

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-colors duration-500">
        <div className={`h-1 bg-gradient-to-r ${scoreInfo.gradient}`} />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-1000"
                  style={{
                    opacity: revealed ? 0.25 : 0,
                    background: `linear-gradient(135deg, ${scoreInfo.gradientFrom}, ${scoreInfo.gradientTo})`,
                  }}
                />

                <div className="relative h-32 w-32">
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="6" className="text-[var(--color-border)]" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={`url(#scoreGrad-${repo?.stars ?? 0}-${displayTotal})`}
                      strokeWidth="6"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset,
                        transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <defs>
                      <linearGradient id={`scoreGrad-${repo?.stars ?? 0}-${displayTotal}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={scoreInfo.gradientFrom} />
                        <stop offset="100%" stopColor={scoreInfo.gradientTo} />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-display text-3xl font-bold tracking-tight ${scoreInfo.accent}`}>
                      {animatedScore}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                      Score
                    </span>
                  </div>
                </div>

                <div className={`absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-lg ${scoreInfo.bgAccent} border ${scoreInfo.borderAccent}`}>
                  <span className={`font-display text-xs font-black ${gradeInfo.color}`}>{gradeInfo.letter}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 sm:items-start">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold ${scoreInfo.bgAccent} ${scoreInfo.accent} border ${scoreInfo.borderAccent}`}>
                    {scoreInfo.label}
                  </span>
                  {hasCustomWeights && (
                    <span className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      Custom
                    </span>
                  )}
                </div>

                {repo && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      <span className="text-sm font-semibold text-[var(--color-text)]">{repo.stars.toLocaleString()}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">stars</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                      <span className="text-sm font-semibold text-[var(--color-text)]">{repo.forks.toLocaleString()}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">forks</span>
                    </div>
                    {repo.language && (
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        <span className="text-sm text-[var(--color-text-secondary)]">{repo.language}</span>
                      </div>
                    )}
                  </div>
                )}

                {computedAt && (
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const days = daysAgo(computedAt);
                      if (days > 30) {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            Stale {days}d
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs font-mono text-[var(--color-text-muted)]">
                          {days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`}
                          <span className="mx-1.5">·</span>
                          {formatDate(computedAt)}
                        </span>
                      );
                    })()}
                  </div>
                )}

                {hasCustomWeights && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Original:{" "}
                    <span className="font-semibold text-[var(--color-text-secondary)]">{total}/100</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {Object.entries(subscores).map(([key, value], index) => (
              <SubScoreItem
                key={key}
                keyName={key}
                value={value}
                index={index}
                revealed={mounted && revealed}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
