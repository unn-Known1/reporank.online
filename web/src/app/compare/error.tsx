"use client";

export default function CompareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950">
        <h2 className="mb-2 text-xl font-bold text-red-800 dark:text-red-300">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-red-700 dark:text-red-400">
          {error.message || "An unexpected error occurred while loading the comparison page."}
        </p>
        <button
          onClick={reset}
          className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
