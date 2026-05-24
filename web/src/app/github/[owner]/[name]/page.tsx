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
import EvidenceFacts from "@/components/EvidenceFacts";
import ImprovementSuggestions from "@/components/ImprovementSuggestions";
import ShareButton from "@/components/ShareButton";
import VisitorCounter from "@/components/VisitorCounter";
import RepoJsonLd from "@/components/seo/RepoJsonLd";
import RelatedRepos from "@/components/RelatedRepos";
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
  const grade = score != null ? getGrade(Math.round(score.total_score)) : null;
  const scoredPrefix = score != null ? `Score: ${Math.round(score.total_score)}/100 (${grade}) — ` : "";
  const langDesc = repo?.language ? ` ${repo.language} repository` : " Repository";
  const starDesc = repo ? ` ${repo.stars.toLocaleString()} stars` : "";
  const title = `${fullName} — ${scoredPrefix}RepoRank`;
  const description = `RepoRank: ${fullName} scores ${score != null ? Math.round(score.total_score) + "/100 (grade " + grade + ")" : "N/A"}.${langDesc}.${starDesc}. See automated health metrics, AI analysis, and human reviews.`;
  return {
    title,
    description,
    alternates: { canonical: `${base}/github/${owner}/${name}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${fullName} — RepoRank`,
      description,
      type: "website",
      url: `${base}/github/${owner}/${name}`,
      images: [{ url: `${base}/api/og/repo/${owner}/${name}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullName} — RepoRank`,
      description,
      images: [{ url: `${base}/api/og/repo/${owner}/${name}`, width: 1200, height: 630 }],
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
      <RepoJsonLd
        owner={repo.owner}
        name={repo.name}
        description={repo.description}
        language={repo.language}
        stars={repo.stars}
        forks={repo.forks}
        topics={repo.topics ?? []}
        score={score?.total_score ?? null}
        createdAt={repo.created_at}
      />
      <Suspense fallback={null}><FocusScore /></Suspense>
      <div className="mb-6" id="score-section">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">
            <a
              href={`https://github.com/${repo.owner}/${repo.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <span className="text-[var(--color-text-muted)]">{repo.owner}/</span>
              <span>{repo.name}</span>
            </a>
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

      <EvidenceFacts repo={repo} />

      {score ? (
        <div className="mb-6">
          <ScoreWithWeights
            total={score.total_score}
            subscores={score.subscores_json}
            computedAt={score.computed_at}
            repo={{ stars: repo.stars, forks: repo.forks, language: repo.language }}
          />
          <div className="mt-3 flex items-center justify-between">
            <ShareButton
              owner={repo.owner}
              name={repo.name}
              score={score.total_score}
              grade={await getGrade(Math.round(score.total_score))}
            />
            <VisitorCounter initialCount={0} />
          </div>
          {score.total_score < 70 && (
            <ImprovementSuggestions
              score={score.total_score}
              subscores={score.subscores_json}
              stars={repo.stars}
              description={repo.description}
              topics={repo.topics ?? []}
              language={repo.language}
            />
          )}
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

      <Suspense fallback={null}>
        <RelatedRepos language={repo.language} owner={repo.owner} name={repo.name} />
      </Suspense>

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
