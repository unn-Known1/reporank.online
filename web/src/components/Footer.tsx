export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]" aria-label="Footer">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-sm">
                <span className="text-xs font-extrabold text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>RR</span>
              </div>
              <span className="text-base font-bold text-[var(--color-text)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>RepoRank</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] max-w-xs">
              Repository credibility scores powered by automated health metrics, AI analysis, and community reviews.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Explore</h3>
            <ul className="mt-4 space-y-3">
              <li><FooterLink href="/about">About</FooterLink></li>
              <li><FooterLink href="/faq">FAQ</FooterLink></li>
              <li><FooterLink href="/badge-builder">Badge Builder</FooterLink></li>
              <li><FooterLink href="/extension">Extension</FooterLink></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li><FooterLink href="/blog">Blog</FooterLink></li>
              <li><FooterLink href="/blog/community">Community</FooterLink></li>
              <li><FooterLink href="/blog/feed.xml">RSS Feed</FooterLink></li>
              <li><FooterLink href="/blog/community/feed.xml">Community RSS</FooterLink></li>
              <li>
                <FooterLink href="https://github.com/unn-Known1/reporank.online" external>
                  GitHub
                </FooterLink>
              </li>
              <li><FooterLink href="/compare">Compare</FooterLink></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li className="text-sm text-[var(--color-text-muted)]">MIT License</li>
              <li><FooterLink href="https://docs.github.com/en/rest">Data from GitHub API</FooterLink></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-[var(--color-border)] pt-6">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-[var(--color-text-muted)]">&copy; {new Date().getFullYear()} RepoRank.</p>
            <span className="text-xs font-mono text-[var(--color-text-subtle)]">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)]">
        {children}
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    );
  }
  return (
    <a href={href} className="text-sm text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)]">
      {children}
    </a>
  );
}
