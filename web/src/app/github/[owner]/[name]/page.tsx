import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
import ReviewSection from "@/components/ReviewSection";
import ScoreWithWeights from "@/components/ScoreWithWeights";
import MaintainerBanner from "@/components/MaintainerBanner";
import AiReviewRefreshButton from "@/components/AiReviewRefreshButton";
import AiAnalysisPending from "@/components/AiAnalysisPending";
import ScoreRefreshButton from "@/components/ScoreRefreshButton";
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
import { getReviewSummary, getReviewsByRepo } from "@/lib/db/reviews";
import { getWatchlistItem } from "@/lib/db/watchlist";
import { supabaseServer } from "@/lib/supabase/server";
import { getGitHubToken } from "@/lib/github/token";
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

function getGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

function daysAgoLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
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
  created_at: string;
};

type Score = {
  total_score: number;
  subscores_json: SubScores;
  computed_at: string;
  factors_json?: Record<string, unknown> | null;
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

export default async function RepoPage({ params }: PageProps) {
  const { owner, name } = params;

  const supabase = await supabaseServer();
  let user = null;
  if (supabase) {
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
  }
  const currentUserGitHubUsername = user?.user_metadata?.user_name as string | undefined;
  const { isUserToken } = await getGitHubToken();
  const tokenSource = isUserToken ? "user" : "app";

  const repo = await getRepoByOwnerName(owner, name);
  if (!repo) return notFound();

  // Fetch all data server-side in parallel — zero client-side fetch on initial load
  const [score, ai, review_summary, initialReviewsData, watchlistItem] = await Promise.all([
    getLatestScore(repo.id),
    getAiReview(repo.id),
    getReviewSummary(repo.id),
    getReviewsByRepo(repo.id, 5, 0),
    user ? getWatchlistItem(user.id, repo.id).catch(() => null) : Promise.resolve(null),
  ]);

  const initialIsWatched = watchlistItem != null;
  const lastCommitDaysAgo = score?.factors_json
    ? (score.factors_json as Record<string, unknown>).lastCommitDaysAgo as number | null
    : null;
  const isStale = score?.computed_at
    ? Math.floor((Date.now() - new Date(score.computed_at).getTime()) / 86400000) > 30
    : false;

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
        reviewCount={review_summary.count}
        createdAt={repo.created_at}
      />
      <Suspense fallback={null}><FocusScore /></Suspense>

      {/* ── Repo header ── */}
      <div className="mb-6" id="score-section">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">
            <a
              href={`https://github.com/${repo.owner}/${repo.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span className="text-[var(--color-text-muted)]">{repo.owner}/</span>
              <span>{repo.name}</span>
              <svg className="h-4 w-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </h1>
          <div className="flex items-center gap-3">
            <CompareCheckbox owner={repo.owner} name={repo.name} />
            <WatchlistButton owner={repo.owner} name={repo.name} repoId={repo.id} initialIsWatched={initialIsWatched} />
          </div>
        </div>

        {repo.description && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {repo.description}
          </p>
        )}

        {/* Stats row: stars · forks · language · last commit */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[var(--color-text-muted)]">
          {repo.stars > 0 && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span className="font-semibold text-[var(--color-text)]">{repo.stars.toLocaleString()}</span>
            </span>
          )}
          {repo.forks > 0 && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              <span className="font-semibold text-[var(--color-text)]">{repo.forks.toLocaleString()}</span>
              <span className="text-xs">forks</span>
            </span>
          )}
          {repo.language && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-elevated)] px-3 py-1 border border-[var(--color-border)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              {repo.language}
            </span>
          )}
          {lastCommitDaysAgo != null && (
            <span className={`inline-flex items-center gap-1 text-xs font-mono ${lastCommitDaysAgo > 365 ? "text-danger-500" : lastCommitDaysAgo > 90 ? "text-warning-600 dark:text-warning-400" : "text-[var(--color-text-muted)]"}`}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last commit {daysAgoLabel(lastCommitDaysAgo)}
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

        {/* Topic pills as links */}
        {Array.isArray(repo.topics) && repo.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {repo.topics.map((t: string) => (
              <Link
                key={t}
                href={`/?q=${encodeURIComponent(t)}`}
                className="rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors duration-150"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>

      <EvidenceFacts repo={repo} />

      {/* ── Score ── */}
      {score ? (
        <div className="mb-6">
          <ScoreWithWeights
            total={score.total_score}
            subscores={score.subscores_json}
            computedAt={score.computed_at}
            tokenSource={tokenSource}
            repo={{ stars: repo.stars, forks: repo.forks, language: repo.language }}
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShareButton
                owner={repo.owner}
                name={repo.name}
                score={score.total_score}
                grade={getGrade(Math.round(score.total_score))}
              />
              {isStale && <ScoreRefreshButton owner={repo.owner} name={repo.name} />}
            </div>
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

      {/* ── Badge — moved above AI for higher visibility ── */}
      <div className="mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">Badge</h2>
          <span className="text-xs text-[var(--color-text-muted)]">Embed in your README</span>
        </div>
        <LazyBadgeExport owner={repo.owner} name={repo.name} />
      </div>

      {/* ── AI Analysis ── */}
      <div className="mb-6 mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">AI Analysis</h2>
          <AiReviewRefreshButton owner={owner} name={name} />
        </div>
        {ai ? (
          <LazyAiAnalysisCard
            ai={{
              ...ai,
              evidence: score?.factors_json
                ? {
                    lastCommitDaysAgo: (score.factors_json as Record<string, unknown>).lastCommitDaysAgo as number | null,
                    contributorCount: (score.factors_json as Record<string, unknown>).contributorCount as number | null,
                    totalCommits: (score.factors_json as Record<string, unknown>).totalCommits as number | null,
                    readmeLength: (score.factors_json as Record<string, unknown>).readmeWordCount as number | null,
                    stars: repo.stars,
                  }
                : null,
            }}
          />
        ) : (
          <AiAnalysisPending owner={owner} name={name} />
        )}
      </div>

      <MaintainerBanner ownerName={currentUserGitHubUsername ?? null} repoOwner={owner} />

      <div className="mb-6">
        <LazyScoreHistoryChart owner={repo.owner} name={repo.name} />
      </div>

      <Suspense fallback={null}>
        <RelatedRepos language={repo.language} repoId={repo.id} />
      </Suspense>

      <div id="review-section" className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-[var(--color-text)]">
          Human Reviews
          {review_summary.count > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-surface-elevated)] px-2 py-0.5 text-sm font-normal font-mono text-[var(--color-text-muted)] border border-[var(--color-border)]">
              ({review_summary.count})
            </span>
          )}
        </h2>
        <ReviewSection
          repoId={repo.id}
          owner={repo.owner}
          name={repo.name}
          initialReviews={initialReviewsData.reviews}
          initialTotal={initialReviewsData.total}
        />
      </div>
    </main>
  );
}
