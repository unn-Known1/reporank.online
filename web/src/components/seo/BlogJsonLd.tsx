const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

interface BlogJsonLdProps {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  updatedAt?: string | null;
  authorName: string;
  authorUrl?: string | null;
  authorSameAs?: string | null;
  image?: string | null;
  readingTimeMinutes?: number;
}

export default function BlogJsonLd({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  authorName,
  authorUrl,
  authorSameAs,
  image,
  readingTimeMinutes,
}: BlogJsonLdProps) {
  const author: Record<string, string> = {
    "@type": "Person",
    name: authorName,
  };
  if (authorUrl) author.url = `${BASE_URL}${authorUrl}`;
  if (authorSameAs) author.sameAs = authorSameAs;

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    author,
    publisher: {
      "@type": "Organization",
      name: "RepoRank",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/favicon.svg`,
        width: 512,
        height: 512,
      },
    },
  };

  if (readingTimeMinutes) {
    jsonLd.timeRequired = `PT${readingTimeMinutes}M`;
  }

  if (image) {
    jsonLd.image = { "@type": "ImageObject", url: image };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
