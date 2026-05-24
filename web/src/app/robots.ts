import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";
  return {
    rules: [
      { userAgent: "*", allow: "/api/badge/" },
      { userAgent: "*", disallow: ["/api/", "/auth/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
