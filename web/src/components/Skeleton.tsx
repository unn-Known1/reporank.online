type SkeletonProps = { className?: string };

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className="rounded-md animate-shimmer"
      style={{ background: "linear-gradient(90deg, var(--color-border) 0%, var(--color-border-strong) 50%, var(--color-border) 100%)", backgroundSize: "200% 100%" }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="space-y-4" role="presentation">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonScore() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <div className="h-28 w-28 rounded-full bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-[var(--color-canvas)]" />
        </div>
      </div>
      <div className="flex flex-col items-center space-y-3">
        <div className="h-4 w-32 rounded-md bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-28 rounded-md bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-36 rounded-md bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-24 rounded-md bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-20 rounded-md bg-gradient-to-r from-[var(--color-border)] via-[var(--color-border-strong)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer" />
      </div>
    </div>
  );
}
