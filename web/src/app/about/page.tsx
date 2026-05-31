import type { Metadata } from "next";

const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export const metadata: Metadata = {
  title: "About — RepoRank",
  description:
    "RepoRank is an open-source platform that scores GitHub repositories using automated health metrics, AI analysis, and community reviews. Evidence-first, transparent, and free.",
  alternates: { canonical: `${base}/about` },
  openGraph: {
    title: "About — RepoRank",
    description:
      "RepoRank provides repository credibility scores powered by automated health metrics, AI analysis, and community reviews. Learn about our mission and how it works.",
    type: "website",
    url: `${base}/about`,
  },
  twitter: {
    card: "summary_large_image",
    title: "About — RepoRank",
    description:
      "RepoRank provides repository credibility scores powered by automated health metrics, AI analysis, and community reviews. Learn about our mission and how it works.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About RepoRank",
  description:
    "RepoRank is an open-source platform that scores GitHub repositories using automated health metrics, AI analysis, and community reviews.",
  url: `${base}/about`,
  provider: {
    "@type": "Organization",
    name: "RepoRank",
    url: base,
  },
};

const dimensions = [
  {
    title: "Documentation",
    desc: "README quality, presence of contributing guidelines, code of conduct, and license files.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: "Maintenance",
    desc: "Commit frequency, release cadence, issue resolution time, and recent activity.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Community",
    desc: "Contributor count, fork activity, pull request velocity, and issue engagement.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "Code Maturity",
    desc: "Codebase age, version stability, test coverage signals, and CI/CD setup.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    title: "Ecosystem",
    desc: "Package manager presence, dependency health, and platform integrations.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">About RepoRank</h1>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        <p>
          RepoRank is an <strong>open-source platform</strong> that helps developers evaluate
          the credibility of GitHub repositories. Instead of relying on a single metric like
          star count, RepoRank computes a <strong>5-dimension health score</strong> based on
          automated metrics, AI analysis, and community reviews.
        </p>

        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">Why RepoRank?</h2>
        <p>
          Star counts can be misleading. A repo with thousands of stars might be abandoned,
          while a well-maintained project with few stars could be the perfect fit. RepoRank
          cuts through the noise by measuring what actually matters: documentation quality,
          maintenance activity, community engagement, code maturity, and ecosystem integration.
        </p>

        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">The Five Dimensions</h2>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {dimensions.map((d) => (
          <div
            key={d.title}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {d.icon}
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">{d.title}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">{d.desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">Evidence-First</h2>
        <p>
          Every score is backed by evidence. You can see exactly which metrics contributed,
          when they were last updated, and how each dimension was calculated. No black boxes
          — transparency is a core design principle.
        </p>

        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">How Scoring Works</h2>
        <p>
          The deterministic scoring engine analyzes public GitHub data across five dimensions
          and normalizes them into a 0-100 score. When a repository is first looked up, AI
          analysis provides an initial baseline before any human reviews exist. Community
          members can then contribute reviews and vote on their helpfulness.
        </p>

        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">Open Source</h2>
        <p>
          The entire platform is open source under the{" "}
          <a
            href="https://github.com/unn-Known1/reporank.online/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            MIT license
          </a>
          . You can inspect the scoring engine, the API, and the frontend code on{" "}
          <a
            href="https://github.com/unn-Known1/reporank.online"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            GitHub
          </a>
          . Contributions, suggestions, and bug reports are welcome.
        </p>

        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">Built by Developers, for Developers</h2>
        <p>
          RepoRank was created by developers who wanted a better way to assess repositories
          before adopting them. The platform is free to use, and badges are available for
          embedding scores in README files and documentation sites.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--color-text)]">
            Ready to try it?
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Search any GitHub repository to see its credibility score, or build a badge for your own project.
          </p>
          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Search a Repo
            </a>
            <a
              href="/badge-builder"
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
            >
              Badge Builder
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
