"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
  owner: string;
  name: string;
  repoId: string;
};

export default function WatchlistButton({ owner, name, repoId }: Props) {
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user;
      setUser(u ?? null);
      if (u) {
        fetch(`/api/user/watchlist/${repoId}`)
          .then((r) => r.json())
          .then((data) => setWatching(data.watching))
          .catch(() => {});
      }
    });
  }, [repoId]);

  const handleClick = async () => {
    if (!user) {
      const supabase = supabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(window.location.pathname)}`;
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo, scopes: "read:user" },
      });
      return;
    }

    setLoading(true);
    try {
      if (watching) {
        const res = await fetch(`/api/user/watchlist/${repoId}`, { method: "DELETE" });
        if (res.ok) setWatching(false);
      } else {
        const res = await fetch("/api/user/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, name }),
        });
        if (res.ok) setWatching(true);
        if (res.status === 404) alert("Repo not found. Search for it first.");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
        watching
          ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
      }`}
    >
      <svg
        className="h-4 w-4"
        fill={watching ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
      {watching ? "Watching" : "Watch"}
    </button>
  );
}
