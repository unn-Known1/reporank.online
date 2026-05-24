"use client";

import { Component, Suspense, useState, useEffect } from "react";
import type { ReactNode } from "react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <section className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Something went wrong</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Try refreshing the page.</p>
          </section>
        )
      );
    }
    return this.props.children;
  }
}

function FAQSkeleton() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-14 text-center">
        <div className="mx-auto mb-6 h-4 w-24 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="mx-auto h-10 w-64 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="mx-auto mt-3 h-4 w-40 animate-pulse rounded bg-[var(--color-border)]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-[var(--color-border)]" />
        ))}
      </div>
    </section>
  );
}

export default function FAQPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FAQSkeleton />}>
        <FAQContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function FAQContent() {
  useEffect(() => {
    document.title = "RepoRank — Frequently Asked Questions";
  }, []);
  return (
    <section className="relative mx-auto max-w-3xl px-4 py-16">
      <div className="mb-14 text-center">
        <a href="/" className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to search
        </a>
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-muted)]">
          How RepoRank works
        </p>
      </div>

      <div className="space-y-3">
        <FAQItem
          question="How does RepoRank calculate scores?"
          answer="RepoRank computes a composite credibility score from 5 weighted subscores: Maintenance (30%), Community (25%), Security (20%), Documentation (15%), and Adoption (10%). In total, 17 public GitHub data points feed into these subscores — including commit frequency, issue response time, contributor count, security policies, README completeness, and more. All data is sourced from public GitHub information."
        />

        <FAQItem
          question="Why aren't GitHub stars the score?"
          answer="Stars measure popularity, not health. A repository with 50,000 stars could be completely abandoned. RepoRank tries to answer a different question: is this project actively maintained and likely to be reliable? A repo with 500 stars and weekly commits is scored higher than one with 50k stars and no activity in two years."
        />

        <FAQItem
          question="What does 'AI Analysis' mean?"
          answer="When a repository has zero human reviews, RepoRank generates an AI-powered analysis. This is a starting point to give you some insight even for new or obscure repos — not a substitute for real-world experience. AI reviews are always labeled clearly so you know they're automated."
        />

        <FAQItem
          question="How are human reviews weighted?"
          answer="One review per user per repository. Users can vote a review helpful or unhelpful. Reviews with more helpful votes appear higher in the list. Authors can also mark a review as outdated if the repository has changed significantly since the review was written."
        />

        <FAQItem
          question="How often are scores updated?"
          answer="Scores are computed on-demand when a repository is first looked up and then cached. If you revisit a repo, you get the cached score. AI reviews refresh after 7 days if the repo is re-queried. Your human reviews remain until you update or remove them."
        />

        <FAQItem
          question="Is RepoRank affiliated with GitHub?"
          answer="No. RepoRank is an independent project. We use the GitHub public API to fetch repository data, but we're not endorsed or supported by GitHub in any way."
        />

        <FAQItem
          question="How do I add a RepoRank badge to my README?"
          answer={
            <span>
              Use this markdown snippet, replacing <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-primary)]">owner</code> and <code className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-primary)]">repo</code> with your project details:
              <br /><br />
              <div className="rounded-xl bg-[var(--color-surface-elevated)] p-4 font-mono text-xs text-[var(--color-primary)] border border-[var(--color-border)]">
                [![RepoRank]({baseUrl}/api/badge/owner/repo)]({baseUrl}/github/owner/repo)
              </div>
              <br />
              Badge colors reflect the score: <span className="font-medium text-[var(--color-primary)]">cyan ≥ 70</span>,{' '}
              <span className="font-medium text-amber-500">amber 40–69</span>,{' '}
              <span className="font-medium text-red-500">red {'<'} 40</span>, gray means no score yet.
            </span>
          }
        />

        <FAQItem
          question="I think my repo's score is wrong."
          answer="The best way to improve your score is to encourage people who've actually used your project to leave honest human reviews. You can also raise your score organically by adding a SECURITY.md file, a CONTRIBUTING.md, CI/CD pipelines, test coverage, and releasing regularly. Those factors directly influence the subscores."
        />

        <FAQItem
          question="Does RepoRank track my GitHub account?"
          answer="When you sign in with GitHub, we store your username and avatar to display on your reviews. We do not store your GitHub access token after the session ends. We do not access private repositories."
        />

        <FAQItem
          question="How can I contribute?"
          answer="Leave honest, thoughtful reviews of repositories you've used and trust. Share RepoRank links on projects you believe in. If you want to get involved further, check out our CONTRIBUTING.md on GitHub."
        />
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        open
          ? "border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)]"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {question}
        </span>
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
            open ? "bg-[var(--color-primary)]/15" : "bg-[var(--color-surface-elevated)]"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-all duration-300 ${open ? "rotate-180 text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-smooth ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-5 pt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}
