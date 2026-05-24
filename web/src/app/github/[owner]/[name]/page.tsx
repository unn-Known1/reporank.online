import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import ReviewSection from "@/components/ReviewSection";
import ScoreWithWeights from "@/components/ScoreWithWeights";
import MaintainerBanner from "@/components/MaintainerBanner";
import AiReviewRefreshButton from "@/components/AiReviewRefreshButton";
import { SkeletonCard } from "@/components/Skeleton";
import WatchlistButton from "@/components/WatchlistButton";
import CompareCheckbox from "@/components/CompareCheckbox";
import FocusScore from "@/components/FocusScore";
import { getRepoByOwnerName } from "@/lib/db/repos";
import { getLatestScore } from "@/lib/db/scores";
import { getAiReview } from "@/lib/db/ai";
import { getReviewSummary } from "@/lib/db/reviews";
import { supabaseServer } from "@/lib/supabase/server";
import type { SubScores } from "@reporank/core";

const LazyScoreHistoryChart = dynamic(
  () => import("@/components/ScoreHistoryChart"),
  { ssr: false, loading: () => <SkeletonCard /> }
);

const LazyBadgeExport = dynamic(
  () => import("@/components/BadgeExport"),
  { ssr: false, loading: () => <SkeletonCard /> }
);

const LazyAiAnalysisCard = dynamic(
  () => import("@/components/AiAnalysisCard"),
  { loading: () => <SkeletonCard /> }
);

type PageProps = { params: { owner: string; name: string }; searchParams?: { focus?: string } };

async function getGrade(score: number): Promise<string> {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { owner, name } = params;
  const fullName = `${owner}/${name}`;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";
  const repo = await getRepoByOwnerName(owner, name);
  const score = repo && await getLatestScore(repo.id).catch(() => null);
  const scoreDesc = score != null
    ? `scores ${Math.round(score.total_score)}/100 (grade ${getGrade(Math.round(score.total_score))})`
    : "check the credibility score";
  const description = `RepoRank: ${fullName} ${scoreDesc}. See health metrics, AI analysis, and human reviews.`;
  return {
    title: `${fullName} — RepoRank`,
    description,
    alternates: { canonical: `${base}/github/${owner}/${name}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${fullName} on RepoRank`,
      description,
      type: "website",
      url: `${base}/github/${owner}/${name}`,
    },
    twitter: {
      card: "summary",
      title: `${fullName} — RepoRank`,
      description,
    },
  };
}

type Repo = {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  archived: boolean;
  disabled: boolean;
  topics: string[];
};

type Score = {
  total_score: number;
  subscores_json: SubScores;
  computed_at: string;
};

type AiReview = {
  model_used: string;
  generated_at: string;
  summary: string;
  scores_json: SubScores;
  verdict: "RECOMMENDED" | "CAUTION" | "NOT_RECOMMENDED";
  best_for: string;
  strengths: string[];
  concerns: string[];
  red_flags: string[];
  injection_flagged: boolean;
};

function ErrorCard({ title, message, variant = "warning" }: { title: string; message: string; variant?: "warning" | "danger" | "error" }) {
  const colorMap = {
    warning: {
      border: "border-warning-500/20",
      bg: "bg-warning-500/5",
      iconBg: "bg-warning-500/10",
      iconColor: "text-warning-600 dark:text-warning-500",
      titleColor: "text-warning-800 dark:text-warning-500",
      textColor: "text-warning-700 dark:text-warning-500/80",
    },
    danger: {
      border: "border-danger-500/20",
      bg: "bg-danger-500/5",
      iconBg: "bg-danger-500/10",
      iconColor: "text-danger-600 dark:text-danger-500",
      titleColor: "text-danger-800 dark:text-danger-500",
      textColor: "text-danger-700 dark:text-danger-500/80",
    },
    error: {
      border: "border-danger-500/20",
      bg: "bg-danger-500/5",
      iconBg: "bg-danger-500/10",
      iconColor: "text-danger-600 dark:text-danger-500",
      titleColor: "text-danger-800 dark:text-danger-500",
      textColor: "text-danger-700 dark:text-danger-500/80",
    },
  };
  const c = colorMap[variant];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className={`rounded-xl border ${c.border} ${c.bg} p-6`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.iconBg}`}>
            <svg className={`h-5 w-5 ${c.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-base font-semibold ${c.titleColor}`}>{title}</h2>
            <p className={`mt-1 text-sm ${c.textColor}`}>{message}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function RepoPage({ params }: PageProps) {
  const { owner, name } = params;

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserGitHubUsername = user?.user_metadata?.user_name as string | undefined;

  const repo = await getRepoByOwnerName(owner, name);
  if (!repo) return notFound();

  const [score, ai, review_summary] = await Promise.all([
    getLatestScore(repo.id),
    getAiReview(repo.id),
    getReviewSummary(repo.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={null}><FocusScore /></Suspense>
      <div className="mb-6" id="score-section">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">
            <span className="text-[var(--color-text-muted)]">{repo.owner}/</span>
            <span>{repo.name}</span>
          </h1>
          <div className="flex items-center gap-3">
            <CompareCheckbox owner={repo.owner} name={repo.name} />
            <WatchlistButton owner={repo.owner} name={repo.name} repoId={repo.id} />
          </div>
        </div>
        {repo.description && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {repo.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-[var(--color-text-muted)]">
          {repo.language && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-elevated)] px-3 py-1 border border-[var(--color-border)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              {repo.language}
            </span>
          )}
          {repo.archived && (
            <span className="rounded-full border border-warning-500/30 bg-warning-500/10 px-2.5 py-1 text-xs font-medium text-warning-600 dark:text-warning-500">
              Archived
            </span>
          )}
          {repo.disabled && (
            <span className="rounded-full border border-danger-500/30 bg-danger-500/10 px-2.5 py-1 text-xs font-medium text-danger-600 dark:text-danger-500">
              Disabled
            </span>
          )}
        </div>
        {Array.isArray(repo.topics) && repo.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {repo.topics.map((t: string) => (
              <span key={t} className="rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] border border-[var(--color-border)]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {score ? (
        <div className="mb-6">
          <ScoreWithWeights
            total={score.total_score}
            subscores={score.subscores_json}
            computedAt={score.computed_at}
            repo={{ stars: repo.stars, forks: repo.forks, language: repo.language }}
          />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-[var(--color-text-muted)]">No score yet. This is generated on first lookup.</p>
        </div>
      )}

      <div className="mb-6 mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[var(--color-text)]">AI Analysis</h2>
          <AiReviewRefreshButton owner={owner} name={name} />
        </div>
        {ai ? (
          <LazyAiAnalysisCard ai={ai} />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <p className="text-[var(--color-text-muted)]">No AI analysis yet. This is generated on first lookup.</p>
          </div>
        )}
      </div>

      <MaintainerBanner ownerName={currentUserGitHubUsername ?? null} repoOwner={owner} />

      <div className="mb-6">
        <LazyScoreHistoryChart owner={repo.owner} name={repo.name} />
      </div>

      <div className="mb-6">
        <h2 className="mb-3 font-display text-base font-semibold text-[var(--color-text)]">Badge</h2>
        <LazyBadgeExport owner={repo.owner} name={repo.name} />
      </div>

      <div id="review-section" className="mt-8">
        <h2 className="mb-3 font-display text-base font-semibold text-[var(--color-text)]">
          Human Reviews
          {review_summary.count > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-surface-elevated)] px-2 py-0.5 text-sm font-normal font-mono text-[var(--color-text-muted)] border border-[var(--color-border)]">
              ({review_summary.count})
            </span>
          )}
        </h2>
        <ReviewSection repoId={repo.id} owner={repo.owner} name={repo.name} />
      </div>
    </main>
  );
}
