import SearchBox from "@/components/SearchBox";
import VisitorCounter from "@/components/VisitorCounter";
import { supabaseServer } from "@/lib/supabase/server";
import { Suspense } from "react";

type SiteStats = { repos: number; reviews: number; ai_reviews: number; watchlists: number; trending: number; visitors: number };

async function getSiteStats(): Promise<SiteStats> {
  const supabase = await supabaseServer();
  const statsPromise = supabase.from("site_stats").select("repos_scored_count,reviews_count,ai_reviews_count,visitor_count").eq("id", "landing").maybeSingle();
  const [repoCount, reviewCount, aiCount] = await Promise.all([
    supabase.from("score_runs").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("ai_reviews").select("*", { count: "exact", head: true }),
  ]);
  const liveRepos = repoCount.count ?? 0;
  const liveReviews = reviewCount.count ?? 0;
  const liveAi = aiCount.count ?? 0;
  const { data: statsData } = await statsPromise;
  return {
    repos: liveRepos > 0 ? liveRepos : statsData?.repos_scored_count ?? 0,
    reviews: liveReviews > 0 ? liveReviews : statsData?.reviews_count ?? 0,
    ai_reviews: liveAi > 0 ? liveAi : statsData?.ai_reviews_count ?? 0,
    watchlists: 0, trending: 0,
    visitors: statsData?.visitor_count ?? 0,
  };
}

function StatsSkeleton() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-5 w-16 animate-pulse rounded bg-[var(--color-border)]" />
      </span>
      <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-5 w-16 animate-pulse rounded bg-[var(--color-border)]" />
      </span>
      <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-5 w-16 animate-pulse rounded bg-[var(--color-border)]" />
      </span>
    </div>
  );
}

async function SiteStatsDisplay() {
  const stats = await getSiteStats();
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-2">
          <span className="font-mono font-semibold text-[var(--color-primary)]">{stats.repos.toLocaleString()}+</span>
          repos scored
        </span>
        <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
        <span className="inline-flex items-center gap-2">
          <span className="font-mono font-semibold text-[var(--color-accent)]">{stats.ai_reviews.toLocaleString()}+</span>
          AI reviews
        </span>
        <span className="h-1 w-1 rounded-full bg-[var(--color-border-strong)]" />
        <span className="inline-flex items-center gap-2">
          <span className="font-mono font-semibold text-warning-600 dark:text-warning-500">{stats.reviews.toLocaleString()}+</span>
          human reviews
        </span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
        <VisitorCounter initialCount={stats.visitors} />
      </div>
    </>
  );
}

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Health Score",
    description: "Automated credibility score based on 17 factors across 5 dimensions — maintenance, community, security, documentation, and adoption.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: "AI Analysis",
    description: "Instant AI-powered analysis for every repo when no human reviews exist. Cross-validated against deterministic metrics.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "Human Reviews",
    description: "Real developers share their experience with structured ratings across code quality, documentation, maintenance, and security.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Badge",
    description: "Embed a dynamic credibility badge in your README. Shows your score and links back to your RepoRank page.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-[0.06] dark:opacity-[0.1] blur-3xl" style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/3 rounded-full opacity-[0.04] dark:opacity-[0.06] blur-3xl" style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-3xl text-center animate-scale-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Now in beta — completely free
            </span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl text-[var(--color-text)]">
            Can you trust{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              this repo?
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            RepoRank gives you a credibility score for any GitHub repository —
            combining automated health metrics, AI analysis, and real human reviews.
          </p>

          <div className="mt-10">
            <SearchBox />
          </div>

          <Suspense fallback={<StatsSkeleton />}>
            <SiteStatsDisplay />
          </Suspense>
        </div>
      </section>

      <section id="features" className="relative mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl text-[var(--color-text)]">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[var(--color-text-muted)]">
            Search any repo → Instant score → Make informed decisions
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] mb-4 text-[var(--color-primary)]">
                {feature.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
