"use client";

type Props = {
  delta: number;
  direction: "up" | "down" | "flat" | null;
};

export default function ScoreDelta({ delta, direction }: Props) {
  if (!direction || direction === "flat") return null;

  const isUp = direction === "up";
  const colorClass = isUp
    ? "text-emerald-600 dark:text-emerald-500"
    : "text-danger-600 dark:text-danger-500";

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${colorClass}`}>
      <svg
        className={`h-3 w-3 ${isUp ? "" : "rotate-180"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
      {isUp ? "+" : ""}{delta}
    </span>
  );
}
