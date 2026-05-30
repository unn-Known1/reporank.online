"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AboutNavTab() {
  const pathname = usePathname();
  const isActive = pathname === "/about";

  return (
    <Link
      href="/about"
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[var(--color-primary)] text-white"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
      }`}
    >
      About
    </Link>
  );
}
