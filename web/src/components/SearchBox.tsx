"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { parseRepoInput } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/client";

type RecentSearch = { owner: string; name: string; searchedAt: string };
type SearchResult = {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  topics: string[];
  avatarUrl: string;
};

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

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

const STORAGE_KEY = "reporank:recent-searches";
const MAX_ENTRIES = 10;

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
  const [signInRequired, setSignInRequired] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lookupAbortRef = useRef<AbortController | null>(null);
  const searchGenRef = useRef(0);
  const userDismissedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleGitHubSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      document.cookie = `auth_origin=${window.location.origin}; path=/; max-age=300; SameSite=Lax`;
      const supabase = supabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback`;
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo, scopes: "read:user public_repo" },
      });
    } catch (err) {
      console.error("[SearchBox] GitHub sign-in failed:", err);
    } finally {
      setSigningIn(false);
    }
  }, []);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
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
    setSignInRequired(false);
    const parsed = parseRepoInput(searchValue);
    if (!parsed) {
      if (searchResults.length > 0) {
        const r = searchResults[0];
        setValue(`${r.owner}/${r.name}`);
        setShowDropdown(false);
        setActiveIndex(-1);
        handleSubmit(`${r.owner}/${r.name}`);
        return;
      }
      setError("Enter a valid GitHub URL or owner/repo");
      return;
    }
    setLoading(true);
    try {
      if (lookupAbortRef.current) lookupAbortRef.current.abort();
      const lookupController = new AbortController();
      lookupAbortRef.current = lookupController;

      const res = await fetch("/api/repo/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: searchValue }),
        signal: lookupController.signal,
      });
      if (!mountedRef.current) return;
      if (res.status === 404) {
        setError("Repository not found. Check the owner/repo name.");
      } else if (res.status === 403) {
        setError("Access denied. The repository may be private.");
      } else if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        if (body.error && !body.status) {
          setError(body.error);
          setSignInRequired(false);
        } else if (body.tokenSource === "app") {
          setError(
            "We're processing many requests. Sign in with GitHub to use your personal quota and skip the queue."
          );
          setSignInRequired(true);
        } else {
          const resetIn = body.retryAfterSec ? Math.ceil(body.retryAfterSec / 60) : "a few";
          setError(`Your GitHub API quota is temporarily exhausted. Resets in ~${resetIn} minute(s).`);
          setSignInRequired(false);
        }
      } else if (!res.ok) {
        console.error("[SearchBox] Lookup failed:", { status: res.status, statusText: res.statusText });
        const body = await res.json().catch(() => null);
        console.error("[SearchBox] Lookup error body:", body);
        setError(body?.error || "Something went wrong. Please try again.");
      } else {
        const body = await res.json().catch(() => ({}));
        if (body.status === "queued" && body.jobId) {
          let done = false;
          let attempts = 0;
          while (!done && attempts < 30) {
            await new Promise((r) => setTimeout(r, 1000));
            attempts++;
            try {
              const jobRes = await fetch(`/api/job/${body.jobId}`);
              if (!jobRes.ok) continue;
              const jobData = await jobRes.json();
              if (jobData.status === "completed") {
                done = true;
              } else if (jobData.status === "failed") {
                setError("Failed to process repository.");
                setLoading(false);
                return;
              }
            } catch (err) {
              // Ignore fetch errors during polling
            }
          }
          if (!done) {
            setError("Repository processing is taking longer than expected. Please visit the page directly.");
            setLoading(false);
            return;
          }
        }
        if (!mountedRef.current) return;
        addToRecent(parsed.owner, parsed.name);
        router.push(`/github/${parsed.owner}/${parsed.name}`);
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [value, router, addToRecent, searchResults]);

  const recentFiltered = useMemo(
    () =>
      recent.filter((r) => {
        if (!value) return true;
        return `${r.owner}/${r.name}`.toLowerCase().includes(value.toLowerCase());
      }),
    [recent, value]
  );

  const totalItems = searchResults.length + recentFiltered.length;

  function getItem(index: number): { type: "search" | "recent"; data: SearchResult | RecentSearch } | null {
    if (index < searchResults.length) {
      return { type: "search", data: searchResults[index] };
    }
    const recentIndex = index - searchResults.length;
    if (recentIndex < recentFiltered.length) {
      return { type: "recent", data: recentFiltered[recentIndex] };
    }
    return null;
  }

  function selectItem(index: number) {
    const item = getItem(index);
    if (!item) return;
    if (item.type === "search") {
      const r = item.data as SearchResult;
      const val = `${r.owner}/${r.name}`;
      setValue(val);
      setShowDropdown(false);
      setActiveIndex(-1);
      handleSubmit(val);
    } else {
      const r = item.data as RecentSearch;
      const val = `${r.owner}/${r.name}`;
      setValue(val);
      setShowDropdown(false);
      setActiveIndex(-1);
      handleSubmit(val);
    }
  }

  function handleFocus() {
    clearTimeout(blurTimeoutRef.current);
    const hasItems = totalItems > 0;
    if (hasItems) {
      setShowDropdown(true);
    }
  }

  useEffect(() => {
    if (userDismissedRef.current) return;
    if (searching || searchResults.length > 0 || recentFiltered.length > 0) {
      setShowDropdown(true);
    }
  }, [searching, searchResults, recentFiltered]);

  function handleBlur() {
    blurTimeoutRef.current = setTimeout(() => setShowDropdown(false), 200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      if (totalItems > 0) {
        setShowDropdown(true);
        setActiveIndex(e.key === "ArrowDown" ? 0 : totalItems - 1);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < totalItems) {
        e.preventDefault();
        selectItem(activeIndex);
        return;
      }
      if (searchResults.length > 0) {
        e.preventDefault();
        selectItem(0);
        return;
      }
      if (recentFiltered.length > 0) {
        e.preventDefault();
        selectItem(searchResults.length);
        return;
      }
    }
    if (e.key === "Escape") {
      userDismissedRef.current = true;
      setShowDropdown(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  useEffect(() => {
    const isExactRepo = parseRepoInput(value) !== null;

    if (!value || value.length < 2 || isExactRepo) {
      setSearchResults([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchAbortRef.current) searchAbortRef.current.abort();

    const gen = ++searchGenRef.current;
    setSearching(true);
    setSearchError("");

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const res = await fetch(`/api/repo/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Search failed (${res.status})`);
        }
        const json = await res.json();
        if (json.items && Array.isArray(json.items)) {
          setSearchResults(json.items);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setSearchError(err?.message || "Search failed");
        }
      } finally {
        if (gen === searchGenRef.current) setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, [value]);

  const showRecent = recentFiltered.length > 0;
  const showSearch = searchResults.length > 0;
  const showEmpty = !searching && !searchError && !showSearch && value.length >= 2 && !parseRepoInput(value);
  const showDropdownContent = showDropdown && (showSearch || showRecent || searching || !!searchError || showEmpty);

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
              onChange={(e) => { userDismissedRef.current = false; setValue(e.target.value); }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Search repos or enter owner/repo..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3.5 pl-12 pr-12 text-base text-[var(--color-text)] placeholder-[var(--color-text-muted)] transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
              aria-label="Search repos"
              role="combobox"
              aria-expanded={showDropdownContent}
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

          {showDropdownContent && (
            <div
              id="search-listbox"
              role="listbox"
              aria-label="Search results"
              className="absolute left-0 right-0 top-full z-dropdown mt-2 max-h-96 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-elevated backdrop-blur-xl"
            >
              {showSearch && (
                <>
                  <div className="sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Repositories
                  </div>
                  {searchResults.map((r, i) => (
                    <button
                      key={`search-${r.fullName}`}
                      id={`search-option-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectItem(i);
                      }}
                      className={`w-full px-4 py-3 text-left transition-all duration-150 ${
                        i === activeIndex
                          ? "bg-[var(--color-surface-elevated)]"
                          : "hover:bg-[var(--color-surface-elevated)]"
                        } ${!showRecent && i === searchResults.length - 1 ? "rounded-b-xl" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={r.avatarUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 flex-shrink-0 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--color-text)] truncate">{r.owner}/</span>
                            <span className="text-sm text-[var(--color-text-secondary)] truncate">{r.name}</span>
                          </div>
                          {r.description && (
                            <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                              {r.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                            {r.language && (
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                                {r.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                              </svg>
                              {formatStars(r.stars)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {showSearch && showRecent && (
                <div className="border-t border-[var(--color-border)]" />
              )}

              {showRecent && (
                <>
                  <div className="sticky top-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Recent searches
                  </div>
                  {recentFiltered.map((r, i) => {
                    const displayIndex = searchResults.length + i;
                    return (
                      <button
                        key={`recent-${r.owner}/${r.name}`}
                        id={`search-option-${displayIndex}`}
                        role="option"
                        aria-selected={displayIndex === activeIndex}
                        type="button"
                        onMouseEnter={() => setActiveIndex(displayIndex)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectItem(displayIndex);
                        }}
                        className={`w-full px-4 py-3 text-left transition-all duration-150 ${
                          displayIndex === activeIndex
                            ? "bg-[var(--color-surface-elevated)]"
                            : "hover:bg-[var(--color-surface-elevated)]"
                          } ${displayIndex === totalItems - 1 ? "rounded-b-xl" : ""}`}
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
                    );
                  })}
                </>
              )}

              {searchError && !searching && (
                <div className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                  <p>Search failed. {searchError}</p>
                </div>
              )}

              {showEmpty && !searchError && (
                <div className="px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
                  No repositories found for &ldquo;{value}&rdquo;
                </div>
              )}

              {searching && (
                <div className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-[var(--color-text-muted)]">
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </div>
              )}
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
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3" role="alert">
          <div className="flex items-center gap-2.5">
            <svg className="h-4 w-4 flex-shrink-0 text-danger-600 dark:text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-danger-600 dark:text-danger-500">{error}</p>
          </div>
          {signInRequired && (
            <button
              type="button"
              onClick={handleGitHubSignIn}
              disabled={signingIn}
              className="ml-6 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {signingIn ? "Signing in..." : "Sign in with GitHub"}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
