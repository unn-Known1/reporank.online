type Repo = {
  stars: number;
  forks: number;
  language: string;
  archived: boolean;
  disabled: boolean;
  topics: string[];
  description: string;
};

type FactItem = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  variant?: "info" | "warning" | "danger";
};

type Props = {
  repo: Repo;
};

export default function EvidenceFacts({ repo }: Props) {
  const facts: FactItem[] = [];

  if (repo.archived)
    facts.push({
      icon: (
        <svg className="h-5 w-5 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      label: "Archived",
      value: "This repository is no longer actively maintained",
      variant: "warning",
    });

  if (repo.disabled)
    facts.push({
      icon: (
        <svg className="h-5 w-5 text-danger-600 dark:text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      label: "Disabled",
      value: "This repository has been disabled by GitHub",
      variant: "danger",
    });

  if (repo.language)
    facts.push({
      icon: (
        <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      ),
      label: repo.language,
      value: "Primary language",
    });

  if (repo.stars > 0)
    facts.push({
      icon: (
        <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
      label: repo.stars.toLocaleString(),
      value: "Community stars",
    });

  if (repo.topics?.length > 0) {
    const slice = repo.topics.slice(0, 3);
    const suffix = repo.topics.length > 3 ? ` +${repo.topics.length - 3}` : "";
    facts.push({
      icon: (
        <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
      label: slice.join(", ") + suffix,
      value: "Topics",
    });
  }

  if (repo.forks > 0)
    facts.push({
      icon: (
        <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      ),
      label: repo.forks.toLocaleString(),
      value: "Forks",
    });

  const display = facts.slice(0, 3);
  if (display.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {display.map((fact, i) => (
        <div
          key={i}
          className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${
            fact.variant === "danger"
              ? "border-danger-500/20 bg-danger-500/5"
              : fact.variant === "warning"
              ? "border-warning-500/20 bg-warning-500/5"
              : "border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface)]"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                fact.variant === "danger"
                  ? "bg-danger-500/10"
                  : fact.variant === "warning"
                  ? "bg-warning-500/10"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)]"
              }`}
            >
              {fact.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold truncate ${
                  fact.variant === "danger"
                    ? "text-danger-600 dark:text-danger-500"
                    : fact.variant === "warning"
                    ? "text-warning-600 dark:text-warning-500"
                    : "text-[var(--color-text)]"
                }`}
              >
                {fact.label}
              </p>
              {fact.value && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">{fact.value}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
