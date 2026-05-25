const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

interface BlogJsonLdProps {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  updatedAt?: string | null;
  authorName: string;
  image?: string | null;
}

export default function BlogJsonLd({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  authorName,
  image,
}: BlogJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    author: {
      "@type": "Person",
      name: authorName,
    },
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
    ...(image ? { image: { "@type": "ImageObject", url: image } } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
