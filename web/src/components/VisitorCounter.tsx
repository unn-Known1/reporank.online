"use client";

import { useEffect, useState } from "react";

type Props = {
  initialCount: number;
};

export default function VisitorCounter({ initialCount }: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const key = "reporank_visit_recorded";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/visit", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {});
  }, []);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono font-semibold text-[var(--color-text-muted)]">
        {count.toLocaleString()}+
      </span>
      site visits
    </span>
  );
}
