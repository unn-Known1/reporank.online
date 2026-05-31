"use client";

import { useRef } from "react";

type Props = {
  data: { date: string; total_score: number }[];
  width?: number;
  height?: number;
};

export default function ScoreSparkline({ data, width = 200, height = 40 }: Props) {
  const idCounterRef = useRef(0);
  const uniqueId = ++idCounterRef.current;

  const scores = data.map((d) => d.total_score).filter((s): s is number => typeof s === 'number' && !isNaN(s));
  if (scores.length < 2) return null;

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const padding = 2;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const xScale = (i: number) => padding + (i / (scores.length - 1)) * plotW;
  const yScale = (v: number) => padding + plotH - ((v - min) / range) * plotH;

  const points = scores.map((s, i) => `${xScale(i)},${yScale(s)}`).join(" ");
  const lastScore = scores[scores.length - 1];
  const lineColor = lastScore >= 70 ? "#10b981" : lastScore >= 40 ? "#f59e0b" : "#f43f5e";
  const gradientId = `sparkline-fill-${uniqueId}`;
  const polyPoints = `${points} ${xScale(scores.length - 1)},${height - padding} ${xScale(0)},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible" role="img" aria-label="Score sparkline">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={polyPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={xScale(data.length - 1)} cy={yScale(lastScore)} r="2.5" fill={lineColor} />
      <text x={width - 1} y={padding + 8} fontSize={7} fill="var(--color-text-muted)" textAnchor="end" dominantBaseline="hanging" fontFamily="'JetBrains Mono', monospace">
        {max}
      </text>
      <text x={width - 1} y={height - padding - 1} fontSize={7} fill="var(--color-text-muted)" textAnchor="end" fontFamily="'JetBrains Mono', monospace">
        {min}
      </text>
    </svg>
  );
}
