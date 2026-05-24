"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/AuthButton";
import BlogNavTab from "@/components/blog/BlogNavTab";
import ExtensionNavTab from "@/components/extension/ExtensionNavTab";

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

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let stored = null;
    try { stored = localStorage.getItem("reporank:theme"); } catch {}
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("reporank:theme", next ? "dark" : "light"); } catch {}
  };

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-secondary)]"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRepoInput(searchValue);
    if (!parsed) return;
    setSearchLoading(true);
    router.push(`/github/${parsed.owner}/${parsed.name}`);
  }, [searchValue, router]);

  return (
    <nav className="sticky top-0 z-sticky border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
        <a href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-sm">
            <span className="text-xs font-extrabold text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>RR</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--color-text)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            RepoRank
          </span>
        </a>

        <form onSubmit={handleSearch} className="hidden flex-1 sm:block">
          <div className="relative max-w-xs">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchInputRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search owner/repo..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] py-2 pl-10 pr-10 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
              aria-label="Search repos"
            />
            {!searchValue && (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] md:flex">
                <span>⌘</span>K
              </kbd>
            )}
            {searchValue && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setSearchValue(""); searchInputRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-secondary)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        <div className="flex-1 sm:hidden" />

        <div className="flex items-center gap-2">
          <BlogNavTab />
          <ExtensionNavTab />
          <ThemeToggle />
          <div className="hidden sm:block">
            <AuthButton />
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)] sm:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-smooth sm:hidden ${mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6 pb-5 pt-4">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search owner/repo..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
                aria-label="Search repos"
              />
            </div>
          </form>
          <a href="/blog" className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors mb-2">
            Blog
          </a>
          <div className="flex items-center justify-between">
            {mounted && <AuthButton />}
            <span className="text-xs text-[var(--color-text-muted)] font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
