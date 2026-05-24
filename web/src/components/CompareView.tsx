"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SkeletonCard } from "@/components/Skeleton";

type RepoData = {
  owner: string;
  name: string;
  total_score: number | null;
  subscores: {
    maintenance: number;
    community: number;
    security: number;
    documentation: number;
    adoption: number;
  } | null;
  stars: number;
  forks: number;
  language: string | null;
  last_updated: string | null;
  description: string | null;
};

const SUBSCORE_LABELS: Record<string, string> = {
  maintenance: "Maintenance",
  community: "Community",
  security: "Security",
  documentation: "Documentation",
  adoption: "Adoption",
};

export default function CompareView() {
  const searchParams = useSearchParams();
  const [repos, setRepos] = useState<RepoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compareParam = searchParams.get("compare") ?? "";
  const fullNames = compareParam.split(",").filter(Boolean);

  useEffect(() => {
    if (fullNames.length < 2) {
      setError("Select at least 2 repos to compare.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all(
      fullNames.map(async (full) => {
        const [owner, name] = full.split("/");
        try {
          const res = await fetch(`/api/repo/${owner}/${name}`);
          if (!res.ok) return null;
          const data = await res.json();
          return {
            owner: data.repo.owner,
            name: data.repo.name,
            total_score: data.score?.total_score ?? null,
            subscores: data.score?.subscores_json ?? null,
            stars: data.repo.stars ?? 0,
            forks: data.repo.forks ?? 0,
            language: data.repo.language ?? null,
            last_updated: data.score?.computed_at ?? null,
            description: data.repo.description ?? null,
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      const valid = results.filter(Boolean) as RepoData[];
      if (valid.length < 2) {
        setError("Could not load enough repos for comparison.");
      } else {
        setRepos(valid);
      }
      setLoading(false);
    });
  }, [compareParam]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 font-display text-2xl font-bold tracking-tight text-[var(--color-text)]">
        Repo Comparison
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Metric
              </th>
              {repos.map((repo) => (
                <th key={`${repo.owner}/${repo.name}`} className="px-4 py-3 text-left">
                  <a
                    href={`/github/${repo.owner}/${repo.name}`}
                    className="text-sm font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    <span className="text-[var(--color-text-muted)]">{repo.owner}/</span>
                    {repo.name}
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[var(--color-border)]">
              <td className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                Description
              </td>
              {repos.map((repo) => (
                <td key={`${repo.owner}/${repo.name}-desc`} className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  {repo.description ?? "—"}
                </td>
              ))}
            </tr>

            <tr className="border-t border-[var(--color-border)]">
              <td className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                Total Score
              </td>
              {repos.map((repo) => (
                <td key={`${repo.owner}/${repo.name}-score`} className="px-4 py-3">
                  <span className="text-2xl font-bold tabular-nums text-[var(--color-text)]">
                    {repo.total_score ?? "—"}
                  </span>
                </td>
              ))}
            </tr>

            {repos[0]?.subscores && Object.keys(SUBSCORE_LABELS).map((key) => (
              <tr key={key} className="border-t border-[var(--color-border)]">
                <td className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                  {SUBSCORE_LABELS[key]}
                </td>
                {repos.map((repo) => {
                  const val = (repo.subscores as any)?.[key];
                  return (
                    <td key={`${repo.owner}/${repo.name}-${key}`} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                            style={{ width: `${Math.min(100, (val ?? 0) / 10)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-[var(--color-text-muted)] w-6 text-right">
                          {val ?? "—"}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className="border-t border-[var(--color-border)]">
              <td className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                Stars
              </td>
              {repos.map((repo) => (
                <td key={`${repo.owner}/${repo.name}-stars`} className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                  {repo.stars.toLocaleString()}
                </td>
              ))}
            </tr>

            <tr className="border-t border-[var(--color-border)]">
              <td className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                Forks
              </td>
              {repos.map((repo) => (
                <td key={`${repo.owner}/${repo.name}-forks`} className="px-4 py-3 text-sm tabular-nums text-[var(--color-text)]">
                  {repo.forks.toLocaleString()}
                </td>
              ))}
            </tr>

            <tr className="border-t border-[var(--color-border)]">
              <td className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                Language
              </td>
              {repos.map((repo) => (
                <td key={`${repo.owner}/${repo.name}-lang`} className="px-4 py-3 text-sm text-[var(--color-text)]">
                  {repo.language ?? "—"}
                </td>
              ))}
            </tr>

            <tr className="border-t border-[var(--color-border)]">
              <td className="sticky left-0 bg-[var(--color-canvas)] px-4 py-3 text-xs font-medium text-[var(--color-text-muted)]">
                Last Scored
              </td>
              {repos.map((repo) => (
                <td key={`${repo.owner}/${repo.name}-date`} className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {repo.last_updated
                    ? new Date(repo.last_updated).toLocaleDateString()
                    : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
