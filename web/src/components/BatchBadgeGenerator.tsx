"use client";

import { useState, useMemo, useCallback } from "react";

export default function BatchBadgeGenerator() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("flat");
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const repos = useMemo(() => {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(?:https?:\/\/[^/]+\/)?([^/]+)\/([^/\s]+)/);
        if (!match) return { raw: line, owner: null, name: null, error: "Invalid format" };
        return { raw: line, owner: match[1], name: match[2].replace(/\.git$/, ""), error: null };
      });
  }, [input]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (style !== "flat") p.set("style", style);
    if (theme !== "light") p.set("theme", theme);
    return p.toString();
  }, [style, theme]);

  const snippets = useMemo(() => {
    const qs = params ? `?${params}` : "";
    return repos
      .filter((r) => !r.error)
      .map((r) => ({
        key: `${r.owner}/${r.name}`,
        markdown: `[![RepoRank](https://reporank.online/api/badge/${r.owner}/${r.name}.svg${qs})](https://reporank.online/github/${r.owner}/${r.name})`,
      }));
  }, [repos, params]);

  const allMarkdown = useMemo(() => snippets.map((s) => s.markdown).join("\n\n"), [snippets]);

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(allMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [allMarkdown]);

  const copyOne = useCallback(async (markdown: string, index: number) => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  }, []);

  return (
    <div className="badge-builder">
      <div className="badge-builder-form">
        <div className="badge-builder-field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="batch-input" className="badge-builder-label">Repositories (one per line)</label>
          <textarea
            id="batch-input"
            rows={8}
            placeholder={"facebook/react\nvercel/next.js\ntailwindlabs/tailwindcss"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="badge-builder-input"
            style={{ resize: "vertical", fontFamily: "monospace" }}
          />
        </div>

        <div className="badge-builder-field">
          <label htmlFor="batch-style" className="badge-builder-label">Style</label>
          <select id="batch-style" value={style} onChange={(e) => setStyle(e.target.value)} className="badge-builder-select">
            <option value="flat">Flat</option>
            <option value="plastic">Plastic</option>
            <option value="flat-square">Flat-Square</option>
            <option value="for-the-badge">For the Badge</option>
          </select>
        </div>

        <div className="badge-builder-field">
          <label htmlFor="batch-theme" className="badge-builder-label">Theme</label>
          <select id="batch-theme" value={theme} onChange={(e) => setTheme(e.target.value)} className="badge-builder-select">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>

      {repos.length > 0 && (
        <div className="badge-builder-preview">
          <div className="flex items-center justify-between">
            <p className="badge-builder-section-title">Generated Snippets</p>
            {snippets.length > 1 && (
              <button onClick={copyAll} className="badge-builder-copy-btn">
                {copied ? `Copied ${snippets.length} badges!` : "Copy All"}
              </button>
            )}
          </div>

          {repos.map((repo, i) => (
            <div key={i}>
              {repo.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
                  Invalid: {repo.raw}
                </div>
              ) : (
                <div className="badge-builder-code-block">
                  <pre style={{ flex: 1, margin: 0, overflowX: "auto" }}>
                    <code style={{ fontSize: "0.8125rem", wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                      {snippets.find((s) => s.key === `${repo.owner}/${repo.name}`)?.markdown ?? ""}
                    </code>
                  </pre>
                  <button
                    onClick={() => copyOne(
                      snippets.find((s) => s.key === `${repo.owner}/${repo.name}`)?.markdown ?? "",
                      i,
                    )}
                    className="badge-builder-copy-btn"
                  >
                    {copiedIndex === i ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
