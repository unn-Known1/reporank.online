"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function FocusScore() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("focus") === "score") {
      const el = document.getElementById("score-section");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      }
    }
  }, [searchParams]);

  return null;
}
