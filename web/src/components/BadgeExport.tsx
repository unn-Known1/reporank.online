"use client";

import { useState, useEffect } from "react";

type Props = {
  owner: string;
  name: string;
};

export default function BadgeExport({ owner, name }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [embedMarkdown, setEmbedMarkdown] = useState("");
  const [badgeFailed, setBadgeFailed] = useState(false);

  const badgePath = `/api/badge/${owner}/${name}.svg`;

  useEffect(() => {
    setMounted(true);
    const base = window.location.origin;
    const markdown = `[![RepoRank](${base}${badgePath})](${base}/github/${owner}/${name})`;
    setEmbedMarkdown(markdown);
  }, [owner, name, badgePath]);

  async function handleCopy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(embedMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="relative mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-elevated)] p-3 border border-[var(--color-border)]">
          {badgeFailed ? (
            <span className="text-xs text-[var(--color-text-muted)]">Badge unavailable</span>
          ) : (
            <img
              src={badgePath}
              alt="RepoRank badge"
              className="h-6 w-auto"
              onError={() => setBadgeFailed(true)}
            />
          )}
        </div>
        <span className="text-sm text-[var(--color-text-secondary)]">
          Add this badge to your README to show RepoRank credibility
        </span>
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 font-mono text-sm shadow-inner">
          <div className="absolute right-2 top-2 flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-danger-500/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning-500/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span className="text-[var(--color-text-muted)]">$</span>
            <span className="text-[var(--color-primary)]">cat</span>
            <span className="text-[var(--color-text-muted)]">README.md</span>
          </div>
          <pre className="mt-1 text-xs text-[var(--color-text)] overflow-x-auto">
            {mounted ? embedMarkdown : `[![RepoRank](${badgePath})](/github/${owner}/${name})`}
          </pre>
        </div>

        <button
          onClick={handleCopy}
          aria-label="Copy badge markdown to clipboard"
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            copied
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400"
              : "border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          }`}
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
              Copy
            </>
          )}
        </button>

        <span aria-live="polite" className="sr-only">
          {copied ? "Copied to clipboard" : ""}
        </span>
      </div>

      {error && <p className="mt-3 text-xs text-danger-600 dark:text-danger-500">{error}</p>}
    </div>
  );
}
