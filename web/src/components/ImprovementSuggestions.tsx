import type { SubScores } from "@reporank/core";

type Props = {
  score: number;
  subscores: SubScores;
  stars: number;
  description: string | null;
  topics: string[];
  language: string | null;
};

type Suggestion = {
  label: string;
  impact: string;
  description: string;
};

function getSuggestions(score: number, subscores: SubScores, stars: number, description: string | null, topics: string[], language: string | null): Suggestion[] {
  const items: Suggestion[] = [];

  if (subscores.security < 40) {
    items.push({
      label: "Add a license file",
      impact: "+10–15 pts",
      description: "Repos without a license cannot be legally used by others. Add MIT, Apache 2.0, or GPL to your repo root.",
    });
  }

  if (subscores.documentation < 50) {
    items.push({
      label: "Improve README quality",
      impact: "+8–12 pts",
      description: "Add badges, screenshots, installation steps, API docs, and a feature overview to your README.",
    });
  }

  if (subscores.adoption < 40 || stars < 5) {
    items.push({
      label: "Create GitHub Releases",
      impact: "+10–15 pts",
      description: "Publish tagged releases with changelogs. This signals stability and helps users discover your project.",
    });
  }

  if (!description || description.length < 30) {
    items.push({
      label: "Write a clear repo description",
      impact: "+5 pts",
      description: "A concise, keyword-rich description helps search engines and users understand your project instantly.",
    });
  }

  if ((topics?.length || 0) < 5) {
    items.push({
      label: "Add more topics",
      impact: "+3 pts",
      description: "Topics improve discoverability on GitHub. Add 5–10 relevant tags (e.g., terminal, ssh, mobile).",
    });
  }

  if (subscores.security < 40) {
    items.push({
      label: "Add SECURITY.md",
      impact: "+5–8 pts",
      description: "A SECURITY.md file signals responsible disclosure practices and boosts your security subscore directly.",
    });
  }

  if (subscores.community < 30) {
    items.push({
      label: "Add CONTRIBUTING.md",
      impact: "+3–5 pts",
      description: "Contributing guides signal a well-governed project that welcomes community involvement.",
    });
  }

  if (!language) {
    items.push({
      label: "Add a .gitattributes or detect language",
      impact: "+2 pts",
      description: "Repos without a detected primary language appear incomplete. Ensure your code files use standard extensions.",
    });
  }

  return items;
}

export default function ImprovementSuggestions(props: Props) {
  const suggestions = getSuggestions(props.score, props.subscores, props.stars, props.description, props.topics, props.language);
  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <svg className="h-4 w-4 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">How to Improve Your Score</h3>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-500/80">
            Based on your repo health metrics. Implementing these suggestions could raise your score significantly.
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-amber-500/10 bg-amber-500/[0.03] px-4 py-3"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--color-text)]">{s.label}</span>
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                  {s.impact}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
