import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "@/components/shared/PostHogProvider";
import { CrispChat } from "@/components/shared/CrispChat";
import { Suspense } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eventera.so";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
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
                  '@id': `${APP_URL}/#organization`,
                  name: 'Eventera',
                  url: APP_URL,
                  logo: `${APP_URL}/og-default.png`,
                  sameAs: [],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${APP_URL}/#website`,
                  url: APP_URL,
                  name: 'Eventera',
                  description: 'Registration, tickets, agenda, check-in, networking — and a personalized Eventera Card for every attendee. The complete event platform.',
                  publisher: { '@id': `${APP_URL}/#organization` },
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'Eventera',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web',
                  url: APP_URL,
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free plan available. Pro from $19/month.',
                  },
                  publisher: { '@id': `${APP_URL}/#organization` },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased" style={{ background: '#FAF6EE' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-primary focus:text-cream focus:text-[14px] focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Suspense fallback={null}>
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
