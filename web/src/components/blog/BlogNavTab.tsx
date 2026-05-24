"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BlogNavTab() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/blog");

  return (
    <Link
      href="/blog"
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[var(--color-primary)] text-white"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      Blog
    </Link>
  );
}
