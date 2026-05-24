import Link from "next/link";

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
