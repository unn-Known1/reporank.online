import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found — RepoRank",
  description: "The page or repository you were looking for could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Repo not found</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">
        We couldn&apos;t find that repository. Check the spelling or try a different
        one.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white"
      >
        Search another repo
      </Link>
    </main>
  );
}
