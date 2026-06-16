import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/shared/PostHogProvider";
import { CrispChat } from "@/components/shared/CrispChat";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://karta.cre8so.com"),
  title: {
    default: "Eventera — A new era of events.",
    template: "%s — Eventera",
  },
  description:
    "The complete event platform built for organizers everywhere. Registration, tickets, agenda, check-in, networking — and a personalized Eventera Card for every attendee.",
  openGraph: {
    type: "website",
    siteName: "Eventera",
    title: "Eventera — A new era of events.",
    description:
      "The complete event platform built for organizers everywhere. Registration, tickets, agenda, check-in, networking — and a personalized Eventera Card for every attendee.",
    url: "https://karta.cre8so.com",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Eventera" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@eventera",
    title: "Eventera — A new era of events.",
    description:
      "The complete event platform built for organizers everywhere. Registration, tickets, agenda, check-in, networking — and a personalized Eventera Card for every attendee.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://karta.cre8so.com/#organization',
                  name: 'Eventera',
                  url: 'https://karta.cre8so.com',
                  logo: 'https://karta.cre8so.com/og-default.png',
                  sameAs: [],
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://karta.cre8so.com/#website',
                  url: 'https://karta.cre8so.com',
                  name: 'Eventera',
                  description: 'Registration, tickets, agenda, check-in, networking — and a personalized Eventera Card for every attendee. The complete event platform.',
                  publisher: { '@id': 'https://karta.cre8so.com/#organization' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://karta.cre8so.com/?s={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'Eventera',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web',
                  url: 'https://karta.cre8so.com',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free plan available. Pro from $29/month.',
                  },
                  publisher: { '@id': 'https://karta.cre8so.com/#organization' },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <Suspense>
          <PostHogProvider>
            <ThemeProvider>{children}</ThemeProvider>
            <CookieConsent />
            <CrispChat />
            <Analytics />
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
