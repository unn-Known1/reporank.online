export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto h-9 w-64 animate-pulse rounded bg-[var(--color-surface)]" />
          <div className="mx-auto mt-2 h-5 w-80 animate-pulse rounded bg-[var(--color-surface)]" />
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
    </div>
  );
}
