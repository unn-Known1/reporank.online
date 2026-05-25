import type { Metadata } from "next";
import FaqClient from "./FaqClient";

const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export const metadata: Metadata = {
  title: "FAQ — RepoRank",
  description:
    "Frequently asked questions about RepoRank — how scores are calculated, what AI analysis means, how human reviews work, and how to embed a badge.",
  alternates: { canonical: `${base}/faq` },
  openGraph: {
    title: "FAQ — RepoRank",
    description:
      "How does RepoRank score repositories? Learn about the 5-dimension scoring system, AI analysis, human reviews, and badge embedding.",
    type: "website",
    url: `${base}/faq`,
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — RepoRank",
    description:
      "How does RepoRank score repositories? Learn about the 5-dimension scoring system, AI analysis, human reviews, and badge embedding.",
  },
};

export default function FAQPage() {
  return <FaqClient />;
}
