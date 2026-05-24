"use client";

import { useState, useCallback } from "react";

type Props = {
  url: string;
  title: string;
  description: string;
};

export default function SocialShare({ url, title, description }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title}: ${description}`);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [url]);

  return (
    <div className="mt-8 border-t border-[var(--color-border)] pt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-text)]">Share this post</p>
        <div className="flex items-center gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-sky-500/30 hover:text-sky-500"
            aria-label="Share on Twitter/X"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-blue-700/30 hover:text-blue-700"
            aria-label="Share on LinkedIn"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
          <a
            href={`https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-orange-600/30 hover:text-orange-600"
            aria-label="Share on Hacker News"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 6.708v5.064h1.583V12.87l4.11-6.972h-1.72l-3.247 5.66-3.25-5.66h-1.69z" />
            </svg>
            HN
          </a>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"
            aria-label={copied ? "Copied" : "Copy link"}
          >
            {copied ? (
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
