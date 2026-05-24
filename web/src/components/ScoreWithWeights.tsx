"use client";

import { useState } from "react";
import ScoreSummary from "./ScoreSummary";
import WeightCustomizer from "./WeightCustomizer";
import type { SubScores } from "@reporank/core";

type SubScoreKey = keyof SubScores;

type Props = {
  total: number;
  subscores: SubScores;
  computedAt?: string | null;
  repo?: {
    stars: number;
    forks: number;
    language: string;
  };
};

export default function ScoreWithWeights({ total, subscores, computedAt, repo }: Props) {
  const [weights, setWeights] = useState<Partial<Record<SubScoreKey, number>> | null>(null);

  return (
    <>
      <ScoreSummary total={total} subscores={subscores} weights={weights} computedAt={computedAt} repo={repo} />
      <WeightCustomizer onWeightsChange={setWeights} />
    </>
  );
}
