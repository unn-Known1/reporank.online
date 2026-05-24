interface BlogJsonLdProps {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  authorName: string;
  image?: string | null;
}

export default function BlogJsonLd({
  title,
  description,
  url,
  publishedAt,
  authorName,
  image,
}: BlogJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    author: {
      "@type": "Person",
      name: authorName,
    },
    ...(image ? { image } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
