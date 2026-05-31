"use client";

import { Suspense } from "react";
import { ComparisonProvider } from "@/lib/comparison-context";
import { AuthProvider } from "@/lib/auth-context";
import CompareBar from "@/components/CompareBar";

function CompareBarWrapper() {
  return <CompareBar />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ComparisonProvider>
      <AuthProvider>
        {children}
        <Suspense fallback={null}>
          <CompareBarWrapper />
        </Suspense>
      </AuthProvider>
    </ComparisonProvider>
  );
}
