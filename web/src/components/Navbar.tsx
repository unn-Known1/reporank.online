"use client";

import { useState, useEffect } from "react";
import AuthButton from "@/components/AuthButton";
import BlogNavTab from "@/components/blog/BlogNavTab";
import CommunityNavTab from "@/components/blog/CommunityNavTab";
import ExtensionNavTab from "@/components/extension/ExtensionNavTab";
import AboutNavTab from "@/components/about/AboutNavTab";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

        <div className="hidden flex-1 sm:block" />

        <div className="flex-1 sm:hidden" />

        <div className="hidden md:flex items-center gap-1 mr-2">
          <AboutNavTab />
          <BlogNavTab />
          <CommunityNavTab />
          <ExtensionNavTab />
        </div>
        <div className="flex items-center gap-2">
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

          <a href="/about" className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors mb-1">
            About
          </a>
          <a href="/blog" className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors mb-1">
            Blog
          </a>
          <a href="/blog/community" className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors mb-2">
            Community
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
