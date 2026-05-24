"use client";

import { useState, useCallback } from "react";

type Props = {
  owner: string;
  name: string;
  score: number | null;
  grade: string | null;
};

export default function ShareButton({ owner, name, score, grade }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://reporank.online/github/${owner}/${name}`;
  const scoreText = score != null ? `scored ${score}/100 (${grade})` : "check the score";
  const shareText = `${owner}/${name} ${scoreText} on RepoRank — ${shareUrl}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [shareText]);

  const handleTweet = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [shareText]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"
        aria-label={copied ? "Copied" : "Copy score to clipboard"}
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        )}
        {copied ? "Copied!" : "Share"}
      </button>
      <button
        onClick={handleTweet}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-sky-500/30 hover:text-sky-500"
        aria-label="Share on Twitter/X"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post
      </button>
    </div>
  );
}
