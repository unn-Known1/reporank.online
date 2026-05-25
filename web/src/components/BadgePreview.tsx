"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  owner: string;
  name: string;
  params: string;
};

export default function BadgePreview({ owner, name, params }: Props) {
  const [failed, setFailed] = useState(false);
  const src = `/api/badge/${owner}/${name}.svg${params}`;

  if (failed) {
    return (
      <div className="flex h-7 items-center rounded bg-red-50 px-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
        Preview unavailable
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`RepoRank badge for ${owner}/${name}`}
      width={100}
      height={28}
      className="h-7"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
