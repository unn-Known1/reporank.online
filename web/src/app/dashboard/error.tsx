"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-xl border border-danger-500/20 bg-danger-500/5 p-6">
        <h2 className="text-base font-semibold text-danger-800 dark:text-danger-500">
          Dashboard error
        </h2>
        <p className="mt-1 text-sm text-danger-700 dark:text-danger-500/80">
          {error.message ?? "Something went wrong loading your dashboard."}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface-elevated)]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
