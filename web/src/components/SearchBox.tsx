"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

type RecentSearch = { owner: string; name: string; searchedAt: string };

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const STORAGE_KEY = "reporank:recent-searches";
const MAX_ENTRIES = 10;

function parseRepoInput(input: string): { owner: string; name: string } | null {
  let trimmed = input.trim();
  if (!trimmed) return null;
  const githubUrlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/.*)?$/
  );
  if (githubUrlMatch) {
    const [, owner, name] = githubUrlMatch;
    return { owner, name };
  }
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [owner, name] = parts;
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  return { owner, name };
}

function loadRecent(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(recent: RecentSearch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {}
}

export default function SearchBox() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const addToRecent = useCallback((owner: string, name: string) => {
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.owner !== owner || r.name !== name);
      const next = [{ owner, name, searchedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ENTRIES);
      saveRecent(next);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (submitValue?: string) => {
    const searchValue = submitValue ?? value;
    setError("");
    const parsed = parseRepoInput(searchValue);
    if (!parsed) {
      setError("Enter a valid GitHub URL or owner/repo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/repo/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: searchValue }),
      });
      if (res.status === 404) {
        setError("Repository not found. Check the owner/repo name.");
      } else if (res.status === 403) {
        setError("Access denied. The repository may be private.");
      } else if (res.status === 429) {
        setError("Rate limit exceeded. Please try again later.");
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        addToRecent(parsed.owner, parsed.name);
        router.push(`/github/${parsed.owner}/${parsed.name}`);
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [value, router, addToRecent]);

  const recentFiltered = useMemo(
    () =>
      recent.filter((r) => {
        if (!value) return true;
        return `${r.owner}/${r.name}`.toLowerCase().startsWith(value.toLowerCase());
      }),
    [recent, value]
  );

  function handleFocus() {
    clearTimeout(blurTimeoutRef.current);
    if (recent.length > 0) {
      setShowDropdown(true);
    }
  }

  function handleBlur() {
    blurTimeoutRef.current = setTimeout(() => setShowDropdown(false), 200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      if (recentFiltered.length > 0) {
        setShowDropdown(true);
        setActiveIndex(e.key === "ArrowDown" ? 0 : recentFiltered.length - 1);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < recentFiltered.length - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : recentFiltered.length - 1));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0 && activeIndex < recentFiltered.length) {
      e.preventDefault();
      const item = recentFiltered[activeIndex];
      const val = `${item.owner}/${item.name}`;
      setValue(val);
      setShowDropdown(false);
      setActiveIndex(-1);
      handleSubmit(val);
      return;
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      className="mx-auto flex max-w-xl flex-col gap-3"
    >
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={inputRef}
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="owner/repo or full GitHub URL"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 pl-12 pr-12 text-base text-[var(--color-text)] placeholder-[var(--color-text-muted)] transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              aria-label="Search repos"
              role="combobox"
              aria-expanded={showDropdown && recentFiltered.length > 0}
              aria-controls="search-listbox"
              aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
              aria-autocomplete="list"
            />
            {value && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setValue(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-secondary)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {!value && !showDropdown && (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] sm:flex">
                <span>⌘</span>K
              </kbd>
            )}
          </div>

          {showDropdown && recentFiltered.length > 0 && (
            <div
              id="search-listbox"
              role="listbox"
              aria-label="Recent searches"
              onMouseMove={() => { if (activeIndex !== -1) setActiveIndex(-1); }}
              className="absolute left-0 right-0 top-full z-dropdown mt-2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-elevated backdrop-blur-xl"
            >
              <div className="border-b border-[var(--color-border)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Recent searches
              </div>
              {recentFiltered.map((r, i) => (
                <button
                  key={`${r.owner}/${r.name}`}
                  id={`search-option-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setValue(`${r.owner}/${r.name}`);
                    setShowDropdown(false);
                    setActiveIndex(-1);
                    handleSubmit(`${r.owner}/${r.name}`);
                  }}
                  className={`w-full px-4 py-3 text-left transition-all duration-150 ${
                    i === activeIndex ? "bg-[var(--color-surface-elevated)]" : "hover:bg-[var(--color-surface-elevated)]"
                  } ${i === recentFiltered.length - 1 ? "rounded-b-xl" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)]">
                      <svg className="h-4 w-4 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5Z" strokeLinejoin="round" />
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" opacity="0.6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[var(--color-text)]">{r.owner}/</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">{r.name}</span>
                    </div>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">{timeAgo(r.searchedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="relative inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="hidden sm:inline">Searching</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </>
          )}
        </button>
      </div>

      <div aria-live="polite" className="sr-only">
        {loading ? "Searching..." : error || ""}
      </div>
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3" role="alert">
          <svg className="h-4 w-4 flex-shrink-0 text-danger-600 dark:text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-danger-600 dark:text-danger-500">{error}</p>
        </div>
      )}
    </form>
  );
}
