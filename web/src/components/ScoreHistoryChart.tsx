"use client";

import { useCallback, useEffect, useState } from "react";
import ScoreSparkline from "@/components/ScoreSparkline";

type SubScores = {
  maintenance: number;
  community: number;
  security: number;
  documentation: number;
  adoption: number;
};

type HistoryEntry = {
  date: string;
  total_score: number;
  subscores: SubScores;
};

const SUBSCORE_COLORS: Record<string, { label: string; color: string }> = {
  total: { label: "Total", color: "#06b6d4" },
  maintenance: { label: "Maintenance", color: "#0891b2" },
  community: { label: "Community", color: "#f59e0b" },
  security: { label: "Security", color: "#10b981" },
  documentation: { label: "Documentation", color: "#8b5cf6" },
  adoption: { label: "Adoption", color: "#ec4899" },
};

type Props = {
  owner: string;
  name: string;
};

function getStorageKey(owner: string, name: string): string {
  return `reporank:score-history:${owner}/${name}`;
}

export default function ScoreHistoryChart({ owner, name }: Props) {
  const [data, setData] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(getStorageKey(owner, name));
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as HistoryEntry[];
        setData(parsed);
        setFetched(true);
        setLoading(false);
      } catch {}
    }
  }, [owner, name]);

  useEffect(() => {
    if (fetched || !open) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/repo/${owner}/${name}/score-history?days=90`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load score history`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          const raw = json as any[];
          const entries: HistoryEntry[] = Array.isArray(raw) ? raw.filter((e): e is HistoryEntry =>
            e && typeof e.total_score === 'number' && typeof e.date === 'string'
          ) : [];
          setData(entries);
          setLoading(false);
          setFetched(true);
          sessionStorage.setItem(getStorageKey(owner, name), JSON.stringify(entries));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData([]);
          setLoading(false);
          setFetched(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [owner, name, open, fetched]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const totalData = (data ?? []).map((d) => ({ date: d.date, total_score: d.total_score }));
  const subscoreKeys = ["total", "maintenance", "community", "security", "documentation", "adoption"] as const;

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={toggle}
        className="group flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-left transition-all duration-200 hover:bg-[var(--color-surface)]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
            <svg className="h-4 w-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[var(--color-text)]">Score History</span>
          {!loading && data && data.length > 0 && (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-xs font-mono text-[var(--color-text-muted)] shadow-sm">
              {data.length} points
            </span>
          )}
        </span>
        <svg
          className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform duration-300 ${open ? "rotate-90" : ""}`}
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-500 ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mt-1 rounded-xl border border-t-0 border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-20 w-full rounded-xl bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 w-full rounded-lg bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer" />
                ))}
              </div>
            </div>
          ) : !data || data.length < 2 ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                <svg className="h-5 w-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Not enough data to show history yet. Scores are recorded each time a repo is looked up.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {SUBSCORE_COLORS.total.label}
                </span>
                <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3 border border-[var(--color-border)]">
                  <ScoreSparkline data={totalData} width={300} height={50} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {subscoreKeys.slice(1).map((key) => {
                  const config = SUBSCORE_COLORS[key];
                  const subData = (data ?? []).map((d) => ({
                    date: d.date,
                    total_score: d.subscores[key as keyof SubScores],
                  }));
                  return (
                    <div key={key} className="rounded-lg bg-[var(--color-surface-elevated)] p-3 border border-[var(--color-border)]">
                      <span className="mb-1.5 block text-xs font-medium" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <ScoreSparkline data={subData} width={120} height={24} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
