import SearchBox from "@/components/SearchBox";
import VisitorCounter from "@/components/VisitorCounter";
import { supabaseServer } from "@/lib/supabase/server";
import { Suspense } from "react";

type SiteStats = { repos: number; reviews: number; ai_reviews: number; watchlists: number; trending: number; visitors: number };

async function getSiteStats(): Promise<SiteStats> {
  const supabase = await supabaseServer();
  if (!supabase) return { repos: 0, reviews: 0, ai_reviews: 0, watchlists: 0, trending: 0, visitors: 0 };
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

type FeatureVariant = "score" | "ai" | "reviews" | "badge";

const features: { icon: React.ReactNode; title: string; description: string; variant: FeatureVariant }[] = [
  {
    icon: (
      <div className="relative flex h-9 w-9 items-center justify-center">
        <svg className="absolute inset-0 h-9 w-9 -rotate-90" viewBox="0 0 28 28" aria-hidden="true">
          <circle cx="14" cy="14" r="11.5" fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
          <circle cx="14" cy="14" r="11.5" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeDasharray="72.3" strokeDashoffset="21.7" strokeLinecap="round" />
        </svg>
        <span className="font-mono text-[10px] font-bold text-[var(--color-primary)]">72</span>
      </div>
    ),
    title: "Health Score",
    description: "Automated credibility score based on 17 factors across 5 dimensions — maintenance, community, security, documentation, and adoption.",
    variant: "score",
  },
  {
    icon: (
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent)]/10 px-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">AI</span>
      </div>
    ),
    title: "AI Analysis",
    description: "Instant AI-powered analysis for every repo when no human reviews exist. Cross-validated against deterministic metrics.",
    variant: "ai",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Human Reviews",
    description: "Real developers share their experience with structured ratings across code quality, documentation, maintenance, and security.",
    variant: "reviews",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="4" y="8" width="16" height="10" rx="2" strokeLinejoin="round" />
        <path d="M7 13h2M10 13h2" strokeLinecap="round" />
        <path d="M6 5h12a2 2 0 012 2v1H4V7a2 2 0 012-2z" strokeLinejoin="round" />
      </svg>
    ),
    title: "Badge",
    description: "Embed a dynamic credibility badge in your README. Shows your score and links back to your RepoRank page.",
    variant: "badge",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[80vh] items-center justify-center px-6">
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
<span className="text-[var(--color-primary)]">
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

          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Try <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-[var(--color-text-secondary)]">facebook/react</kbd>{" "}
            or <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-[var(--color-text-secondary)]">vercel/next.js</kbd>
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-all duration-300 hover:shadow-elevated">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
                <svg className="absolute inset-0 h-14 w-14 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset="29.2" strokeLinecap="round" />
                </svg>
                <span className="font-display text-lg font-extrabold text-[var(--color-primary)]">B+</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[var(--color-text)]">facebook/</span>
                  <span className="truncate text-sm text-[var(--color-text-secondary)]">react</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Score: <span className="font-mono font-medium text-emerald-500">72</span> — Good</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
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
          {features.map((feature, index) => {
            const accentBorders: Record<FeatureVariant, string> = {
              score: "before:bg-[var(--color-primary)]",
              ai: "before:bg-[var(--color-accent)]",
              reviews: "before:bg-amber-500",
              badge: "before:bg-emerald-500",
            };
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated before:absolute before:inset-x-0 before:top-0 before:h-0.5 ${accentBorders[feature.variant]}`}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] ${
                  feature.variant === "score" ? "text-[var(--color-primary)]" :
                  feature.variant === "ai" ? "text-[var(--color-accent)]" :
                  feature.variant === "reviews" ? "text-amber-500" :
                  "text-emerald-500"
                }`}>
                  {feature.icon}
                </div>
                {feature.variant === "reviews" && (
                  <div className="mb-2 flex items-center gap-0.5" aria-label="5 star rating">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                )}
                {feature.variant === "badge" && (
                  <div className="mb-2 flex items-center gap-1">
                    <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      B+
                    </span>
                  </div>
                )}
                {feature.variant === "score" && (
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <span className="inline-block h-2 w-5 rounded-sm bg-emerald-400" />
                      <span className="inline-block h-2 w-5 rounded-sm bg-emerald-400" />
                      <span className="inline-block h-2 w-5 rounded-sm bg-amber-400" />
                      <span className="inline-block h-2 w-5 rounded-sm bg-[var(--color-border)]" />
                      <span className="inline-block h-2 w-5 rounded-sm bg-[var(--color-border)]" />
                    </div>
                  </div>
                )}
                <h3 className="font-display text-base font-semibold text-[var(--color-text)]">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
