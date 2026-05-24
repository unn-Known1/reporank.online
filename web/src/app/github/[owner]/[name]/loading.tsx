import { Skeleton, SkeletonCard, SkeletonScore } from "@/components/Skeleton";

export default function RepoLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="mb-3 h-4 w-96" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Score skeleton */}
      <section className="mb-8">
        <SkeletonScore />
      </section>

      {/* Evidence facts skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>

      {/* AI Analysis skeleton */}
      <section className="mb-8">
        <div className="mb-3">
          <Skeleton className="h-5 w-24" />
        </div>
        <SkeletonCard />
      </section>

      {/* Reviews skeleton */}
      <section className="mb-8">
        <div className="mb-3">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>

      {/* Badge skeleton */}
      <section className="mb-8">
        <div className="mb-3">
          <Skeleton className="h-5 w-16" />
        </div>
        <SkeletonCard />
      </section>
    </main>
  );
}
