import Link from "next/link";
import { getRelatedRepos } from "@/lib/db/repos";

export default async function RelatedRepos({
  language,
  repoId,
}: {
  language: string | null;
  repoId: string;
}) {
  const repos = await getRelatedRepos(language, repoId, 5);
  if (repos.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 font-display text-base font-semibold text-[var(--color-text)]">
        {language ? `More ${language} Repos` : "Recent Repos"}
      </h2>
      <div className="space-y-2">
        {repos.map((repo) => (
          <Link
            key={repo.id}
            href={`/github/${repo.owner}/${repo.name}`}
            className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-all duration-200 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-elevated)]"
          >
            {/* Left: name + description — truncate safely */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">
                <span className="text-[var(--color-text-muted)]">{repo.owner}/</span>
                {repo.name}
              </p>
              {repo.description && (
                <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                  {repo.description}
                </p>
              )}
            </div>
            {/* Right: language dot + star count — top-aligned, never overlaps */}
            <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5 text-xs text-[var(--color-text-muted)]">
              {repo.language && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                  {repo.language}
                </span>
              )}
              <span className="whitespace-nowrap">{repo.stars.toLocaleString()} stars</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
