interface RepoJsonLdProps {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  score: number | null;
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
  createdAt,
}: RepoJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "RepoRank", item: baseUrl },
      { "@type": "ListItem", position: 2, name: owner, item: `${baseUrl}/github/${owner}` },
      { "@type": "ListItem", position: 3, name: name, item: `${baseUrl}/github/${owner}/${name}` },
    ],
  };

  const softwareLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: `${owner}/${name}`,
    description: description ?? `${owner}/${name} on RepoRank`,
    codeRepository: `https://github.com/${owner}/${name}`,
    ...(language ? { programmingLanguage: language } : {}),
    operatingSystem: "Cross-platform",
    applicationCategory: "DeveloperApplication",
    ...(score != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(score),
            bestRating: 100,
            ratingCount: 1,
            name: "RepoRank Score",
          },
        }
      : {}),
    author: { "@type": "Person", name: owner },
    ...(createdAt ? { dateCreated: createdAt } : {}),
    keywords: topics.length > 0 ? topics.join(", ") : undefined,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
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
