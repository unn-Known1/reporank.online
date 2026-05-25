import type { Metadata } from "next";
import "../styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "RepoRank — Can you trust this repo?",
    template: "%s — RepoRank",
  },
  description:
    "Repository credibility scores: automated health metrics + AI analysis + human reviews.",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
  openGraph: {
    siteName: "RepoRank",
    images: [{ url: "/api/og/repo/default", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@reporank",
    images: [{ url: "/api/og/repo/default", width: 1200, height: 630 }],
  },
};

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('reporank:theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })()
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RepoRank",
    alternateName: "Repository Credibility Platform",
    description:
      "Repository credibility scores: automated health metrics + AI analysis + human reviews.",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/github/{search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID ?? ""}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID ?? ""}');
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-body antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] blur-3xl" style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
            <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.06] dark:opacity-[0.08] blur-3xl" style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }} />
          </div>
          <Navbar />
          <ServiceWorkerRegistration />
          <Providers>
            <main className="relative flex-1">{children}</main>
          </Providers>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
