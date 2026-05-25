import { Suspense } from "react";
import type { Metadata } from "next";
import BatchBadgeGenerator from "@/components/BatchBadgeGenerator";
import "@/styles/badge-builder.css";

export const metadata: Metadata = {
  title: "Batch Badge Generator — RepoRank",
  description: "Generate RepoRank badges for multiple repositories at once. Paste repo names, pick a style, and copy all markdown snippets.",
  openGraph: {
    title: "Batch Badge Generator — RepoRank",
    description: "Generate RepoRank badges for multiple repositories at once.",
  },
};

export default function BatchPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Batch Badge Generator</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Generate badges for multiple repositories at once
          </p>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-[var(--color-surface)]" />}>
          <BatchBadgeGenerator />
        </Suspense>
      </div>
    </div>
  );
}
