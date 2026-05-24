"use client";

import { Suspense } from "react";
import { ComparisonProvider } from "@/lib/comparison-context";
import CompareBar from "@/components/CompareBar";

function CompareBarWrapper() {
  return <CompareBar />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ComparisonProvider>
      {children}
      <Suspense fallback={null}>
        <CompareBarWrapper />
      </Suspense>
    </ComparisonProvider>
  );
}
