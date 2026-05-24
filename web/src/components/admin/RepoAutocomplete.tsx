"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface RepoSearchResult {
  owner: string;
  name: string;
}

interface RepoAutocompleteProps {
  selected: { owner: string; name: string }[];
  onAdd: (repo: { owner: string; name: string }) => void;
  onRemove: (index: number) => void;
}

const DEBOUNCE_MS = 300;

export default function RepoAutocomplete({ selected, onAdd, onRemove }: RepoAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RepoSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const parts = q.split("/").filter(Boolean);
      const owner = parts[0] || "";
      const name = parts[1] || "";
      const res = await fetch(`/api/repo/search?owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.repos || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  const handleSelect = (repo: RepoSearchResult) => {
    onAdd(repo);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const isSelected = (owner: string, name: string) =>
    selected.some((r) => r.owner === owner && r.name === name);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
        Repositories
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((repo, i) => (
          <span
            key={`${repo.owner}/${repo.name}`}
            className="inline-flex items-center gap-1 rounded bg-[var(--color-surface-elevated)] px-2 py-1 text-xs font-medium"
          >
            {repo.owner}/{repo.name}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="ml-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label={`Remove ${repo.owner}/${repo.name}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search owner/name..."
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]"
      />
      {loading && (
        <div className="absolute right-3 top-[38px] text-xs text-[var(--color-text-muted)]">
          Searching...
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {results.map((repo) => (
            <li key={`${repo.owner}/${repo.name}`}>
              <button
                type="button"
                onClick={() => handleSelect(repo)}
                disabled={isSelected(repo.owner, repo.name)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-elevated)] disabled:opacity-40`}
              >
                {repo.owner}/{repo.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
