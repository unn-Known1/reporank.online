"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { SubScores } from "@reporank/core";
import { DEFAULT_WEIGHTS } from "@reporank/core";

type SubScoreKey = keyof SubScores;

const STORAGE_KEY = "reporank:scoring-weights";

const LABELS: Record<SubScoreKey, string> = {
  maintenance: "Maintenance",
  community: "Community",
  security: "Security",
  documentation: "Documentation",
  adoption: "Adoption",
};

const PRESETS: { name: string; weights: Record<SubScoreKey, number> }[] = [
  { name: "Balanced", weights: { maintenance: 0.30, community: 0.25, security: 0.20, documentation: 0.15, adoption: 0.10 } },
  { name: "Security-Focused", weights: { maintenance: 0.20, community: 0.15, security: 0.40, documentation: 0.15, adoption: 0.10 } },
  { name: "Community-First", weights: { maintenance: 0.20, community: 0.40, security: 0.15, documentation: 0.10, adoption: 0.15 } },
  { name: "Maintenance-Heavy", weights: { maintenance: 0.45, community: 0.20, security: 0.15, documentation: 0.12, adoption: 0.08 } },
];

type Props = {
  onWeightsChange: (weights: Record<SubScoreKey, number>) => void;
};

function loadWeights(): Record<SubScoreKey, number> {
  if (typeof window === "undefined") return { ...DEFAULT_WEIGHTS };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const valid = Object.keys(DEFAULT_WEIGHTS).every((k) => typeof parsed[k] === "number");
      if (valid) return parsed;
    }
  } catch {}
  return { ...DEFAULT_WEIGHTS };
}

function storeWeights(weights: Record<SubScoreKey, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
  } catch {}
}

function normalize(weights: Record<SubScoreKey, number>): Record<SubScoreKey, number> {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum === 0) return { ...DEFAULT_WEIGHTS };
  const result = { ...weights };
  for (const key of Object.keys(result) as SubScoreKey[]) {
    result[key] = Math.round((result[key] / sum) * 100) / 100;
  }
  return result;
}

export default function WeightCustomizer({ onWeightsChange }: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [weights, setWeights] = useState<Record<SubScoreKey, number>>({ ...DEFAULT_WEIGHTS });
  const onChangeRef = useRef(onWeightsChange);
  onChangeRef.current = onWeightsChange;

  useEffect(() => {
    const stored = loadWeights();
    setWeights(stored);
    setMounted(true);
  }, []);

  const handleSlider = useCallback((key: SubScoreKey, value: number) => {
    setWeights((prev) => {
      const updated = normalize({ ...prev, [key]: value / 100 });
      storeWeights(updated);
      onChangeRef.current(updated);
      return updated;
    });
  }, []);

  const handleReset = useCallback(() => {
    const defaults = { ...DEFAULT_WEIGHTS };
    setWeights(defaults);
    storeWeights(defaults);
    onChangeRef.current(defaults);
  }, []);

  const hasCustomWeights = Object.entries(weights).some(
    ([k, v]) => Math.abs(v - DEFAULT_WEIGHTS[k as SubScoreKey]) > 0.001
  );

  return (
    <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5" suppressHydrationWarning>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-[var(--color-text)]"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
            <svg className="h-4 w-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <span>Customize weights</span>
          {hasCustomWeights && (
            <span className="rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
              Modified
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform duration-300 ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ${open ? "max-h-[30rem] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="mr-1 self-center text-xs text-[var(--color-text-muted)]">Presets:</span>
            {PRESETS.map((p) => {
              const active = Object.entries(p.weights).every(([k, v]) => Math.abs(v - weights[k as SubScoreKey]) < 0.001);
              return (
                <button
                  key={p.name}
                  onClick={() => {
                    setWeights(p.weights);
                    storeWeights(p.weights);
                    onChangeRef.current(p.weights);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                    active
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {(Object.keys(DEFAULT_WEIGHTS) as SubScoreKey[]).map((key) => {
            const pct = Math.round(weights[key] * 100);
            const isDefault = Math.abs(weights[key] - DEFAULT_WEIGHTS[key]) < 0.001;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-secondary)]">{LABELS[key]}</span>
                  <span className={`text-sm font-mono font-medium ${isDefault ? "text-[var(--color-text-muted)]" : "text-[var(--color-primary)]"}`}>
                    {pct}%
                  </span>
                </div>
                <div className="relative h-2 w-full">
                  <div className="absolute inset-0 rounded-full bg-[var(--color-border)]" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pct}
                    onChange={(e) => handleSlider(key, Number(e.target.value))}
                    className="absolute inset-0 h-2 w-full cursor-pointer opacity-0 z-10"
                  />
                  <div
                    className="pointer-events-none absolute left-0 top-0 h-2 rounded-full transition-all duration-150 bg-[var(--color-primary)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              Weights auto-normalize to 100% total
            </p>
            {hasCustomWeights && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition-all duration-200 hover:text-[var(--color-primary)]"
              >
                <svg className="h-3.5 w-3.5 transition-transform duration-300 hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Reset to defaults
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
