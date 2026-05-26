interface AuthorBadgeProps {
  type: "admin" | "user";
}

export default function AuthorBadge({ type }: AuthorBadgeProps) {
  if (type === "admin") {
    return (
      <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
        Official Blog
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
      Community
    </span>
  );
}
