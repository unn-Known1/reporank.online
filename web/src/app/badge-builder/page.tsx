import { Suspense } from "react";
import type { Metadata } from "next";
import BadgeBuilder from "@/components/BadgeBuilder";
import "@/styles/badge-builder.css";

export const metadata: Metadata = {
  title: "Badge Builder — RepoRank",
  description: "Create a custom RepoRank badge for any GitHub repository. Choose from multiple styles, themes, and layouts.",
  openGraph: {
    title: "Badge Builder — RepoRank",
    description: "Create a custom RepoRank badge for any GitHub repository.",
  },
};

export default function BadgeBuilderPage() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">Badge Builder</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Create a custom RepoRank badge for your repository README
          </p>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-[var(--color-surface)]" />}>
          <BadgeBuilder />
        </Suspense>
      </div>
    </div>
  );
}
