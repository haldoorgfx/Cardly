import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://karta.cre8so.com"),
  title: {
    default: "Karta — The complete event platform",
    template: "%s — Karta",
  },
  description:
    "Registration, tickets, agenda, check-in, networking — and a personalized Karta Card for every attendee. The complete event platform built for organizers everywhere.",
  openGraph: {
    type: "website",
    siteName: "Karta",
    title: "Karta — The complete event platform",
    description:
      "Registration, tickets, agenda, check-in, networking — and a personalized Karta Card for every attendee. The complete event platform built for organizers everywhere.",
    url: "https://karta.cre8so.com",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Karta" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karta — The complete event platform",
    description:
      "Registration, tickets, agenda, check-in, networking — and a personalized Karta Card for every attendee. The complete event platform built for organizers everywhere.",
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
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
                  name: 'Karta',
                  url: 'https://karta.cre8so.com',
                  logo: 'https://karta.cre8so.com/og-default.png',
                  sameAs: [],
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://karta.cre8so.com/#website',
                  url: 'https://karta.cre8so.com',
                  name: 'Karta',
                  description: 'Registration, tickets, agenda, check-in, networking — and a personalized Karta Card for every attendee. The complete event platform.',
                  publisher: { '@id': 'https://karta.cre8so.com/#organization' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://karta.cre8so.com/?s={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'Karta',
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
        <ThemeProvider>{children}</ThemeProvider>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
