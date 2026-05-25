"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  owner: string;
  name: string;
};

export default function ScoreRefreshButton({ owner, name }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/repo/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: `${owner}/${name}` }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      title={error ? "Refresh failed — try again" : "Refresh score from GitHub"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
        error
          ? "border-danger-500/30 bg-danger-500/10 text-danger-600 dark:text-danger-400"
          : "border-warning-500/30 bg-warning-500/10 text-warning-700 dark:text-warning-400 hover:bg-warning-500/20"
      }`}
      aria-busy={loading}
    >
      <svg
        className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      {loading ? "Refreshing…" : error ? "Failed" : "Refresh score"}
    </button>
  );
}
