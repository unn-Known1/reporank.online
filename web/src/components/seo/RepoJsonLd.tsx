interface RepoJsonLdProps {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  score: number | null;
  reviewCount?: number;
  createdAt: string | null;
}

export default function RepoJsonLd({
  owner,
  name,
  description,
  language,
  stars,
  forks,
  topics,
  score,
  reviewCount = 0,
  createdAt,
}: RepoJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";
  const repoUrl = `${baseUrl}/github/${owner}/${name}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "RepoRank", item: baseUrl },
      { "@type": "ListItem", position: 2, name: owner, item: `${baseUrl}/github/${owner}` },
      { "@type": "ListItem", position: 3, name: name, item: repoUrl },
    ],
  };

  const softwareLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": repoUrl,
    name: `${owner}/${name}`,
    description: description ?? `${owner}/${name} on RepoRank`,
    url: repoUrl,
    downloadUrl: `https://github.com/${owner}/${name}`,
    operatingSystem: "Cross-platform",
    applicationCategory: "DeveloperApplication",
    ...(language ? { programmingLanguage: language } : {}),
    ...(topics.length > 0 ? { keywords: topics } : {}),
    author: { "@type": "Person", name: owner },
    ...(createdAt ? { dateCreated: createdAt } : {}),
    ...(score != null && reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(score),
            bestRating: 100,
            worstRating: 0,
            ratingCount: reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
    </>
  );
}
