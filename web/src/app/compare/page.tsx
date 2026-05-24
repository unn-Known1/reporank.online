import { Suspense } from "react";
import CompareView from "@/components/CompareView";

export const dynamic = 'force-dynamic';

export default function ComparePage() {
  return       <Suspense fallback={<p className="text-center text-[var(--color-text-muted)] py-8">Loading comparison…</p>}><CompareView /></Suspense>;
}
