import Link from "next/link";

interface TagBadgeProps {
  tag: string;
}

export default function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Link
      href={`/blog/community?tag=${encodeURIComponent(tag)}`}
      className="inline-flex items-center rounded-md bg-[var(--color-surface-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
    >
      #{tag}
    </Link>
  );
}
