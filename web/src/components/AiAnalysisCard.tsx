"use client";

import { useState } from "react";

function getVerdictStyle(verdict: string): { badge: string; border: string } {
  switch (verdict) {
    case "RECOMMENDED":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
        border: "border-emerald-100 dark:border-emerald-500/20",
      };
    case "CAUTION":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-500",
        border: "border-amber-100 dark:border-amber-500/20",
      };
    case "NOT_RECOMMENDED":
      return {
        badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-500",
        border: "border-red-100 dark:border-red-500/20",
      };
    default:
      return {
        badge: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
        border: "border-gray-100 dark:border-gray-700",
      };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type AiReview = {
  model_used: string;
  generated_at: string;
  summary: string;
  verdict: "RECOMMENDED" | "CAUTION" | "NOT_RECOMMENDED";
  best_for: string;
  strengths: string[];
  concerns: string[];
  red_flags: string[];
  injection_flagged: boolean;
};

type Props = { ai: AiReview };

export default function AiAnalysisCard({ ai }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  if (ai.injection_flagged) {
    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-danger-500/30 bg-danger-500/5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
            AI Analysis
          </span>
          <span className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-1.5 text-xs font-semibold text-danger-600 dark:text-danger-500">
            Flagged
          </span>
          <span className="ml-auto text-xs font-mono text-[var(--color-text-muted)]">
            {formatDate(ai.generated_at)}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-600 dark:text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-danger-600 dark:text-danger-500">
            This AI analysis was flagged as potentially compromised.
          </p>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">Refreshes every 7 days.</p>
      </div>
    );
  }

  const verdictStyle = getVerdictStyle(ai.verdict);

  return (
    <div className={`relative overflow-hidden rounded-xl border ${verdictStyle.border} bg-[var(--color-surface)] p-5 shadow-sm`}>
      <div className="relative flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
            <svg className="h-4 w-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[var(--color-text)]">AI Analysis</span>
        </div>

        {ai.verdict && (
          <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm ${verdictStyle.badge}`}>
            {ai.verdict.replace("_", " ")}
          </span>
        )}

        <span className="ml-auto text-xs font-mono text-[var(--color-text-muted)]">
          {formatDate(ai.generated_at)}
        </span>
      </div>

      <p className="relative mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{ai.summary}</p>

      <button
        id="ai-analysis-toggle"
        onClick={() => setShowDetails(!showDetails)}
        aria-expanded={showDetails}
        aria-controls="ai-analysis-details"
        className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-all duration-200 hover:brightness-110"
      >
        {showDetails ? "Hide details" : "Show details"}
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id="ai-analysis-details"
        role="region"
        aria-labelledby="ai-analysis-toggle"
        className="overflow-hidden transition-all duration-500"
        style={{ maxHeight: showDetails ? "600px" : "0px", opacity: showDetails ? 1 : 0 }}
      >
        <div className="mt-5 space-y-5 border-t border-[var(--color-border)] pt-5">
          {ai.strengths?.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Strengths
              </h4>
              <ul className="space-y-2">
                {ai.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ai.concerns?.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning-600 dark:text-warning-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Concerns
              </h4>
              <ul className="space-y-2">
                {ai.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ai.red_flags?.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger-600 dark:text-danger-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                Red Flags
              </h4>
              <ul className="space-y-2">
                {ai.red_flags.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-danger-600/80 dark:text-danger-500/80">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-danger-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ai.best_for && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Best For</h4>
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-4 border border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text-secondary)]">{ai.best_for}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 text-xs font-mono text-[var(--color-text-muted)]">Refreshes every 7 days.</p>
    </div>
  );
}
