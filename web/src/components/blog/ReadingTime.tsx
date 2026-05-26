import { computeReadingTime, formatReadingTime } from "@/lib/blog/seo";

interface ReadingTimeProps {
  wordCount: number;
}

export default function ReadingTime({ wordCount }: ReadingTimeProps) {
  return <span>{formatReadingTime(computeReadingTime(wordCount))}</span>;
}
