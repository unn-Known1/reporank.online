"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/client";

type User = { id: string; email?: string; user_metadata?: { user_name?: string; avatar_url?: string } };

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user as User ?? null)).catch(() => setUser(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as User ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleGitHubSignIn = async () => {
    setLoading(true);
    document.cookie = `auth_origin=${window.location.origin}; path=/; max-age=300; SameSite=Lax`;
    const supabase = supabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo, scopes: "read:user public_repo" },
    });
    setLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    setDropdownOpen(false);
  };

  if (user) {
    const displayName = user.user_metadata?.user_name ?? user.email ?? "User";
    const avatarUrl = user.user_metadata?.avatar_url;
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 transition-all duration-200 hover:bg-[var(--color-surface-elevated)]"
        >
          {avatarUrl ? (
            <div className="relative">
              <Image
                src={avatarUrl}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                unoptimized
              />
              <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border-2 border-[var(--color-surface)] bg-emerald-500" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden text-sm font-medium text-[var(--color-text)] sm:inline">{displayName}</span>
          <svg
            className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full z-dropdown mt-2 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-elevated" role="menu">
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <p className="text-xs font-medium text-[var(--color-text)] truncate">{displayName}</p>
              {user.email && <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)] truncate">{user.email}</p>}
            </div>
            <a
              href="/dashboard"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zm9.75-9.75A2.25 2.25 0 0115.75 3H18a2.25 2.25 0 012.25 2.25v2.25A2.25 2.25 0 0118 9.75h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Dashboard
            </a>
            <div className="border-t border-[var(--color-border)]" />
            <button
              onClick={handleSignOut}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleGitHubSignIn}
      disabled={loading}
      aria-label="Sign in with GitHub"
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
      {loading ? (
        <span className="inline-flex items-center gap-1" aria-label="Loading">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "0.4s" }} />
        </span>
      ) : (
        "Sign in"
      )}
    </button>
  );
}
