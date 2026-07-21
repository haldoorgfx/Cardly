import type { Metadata } from 'next';

// The page itself is a client component and cannot export metadata, so the
// whole per-page SEO surface lives here. It previously emitted only a title +
// description and no OpenGraph at all, so shares of /help fell back to the
// generic site card.
export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Guides and answers for organizers and attendees using Eventera.',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL}/help` },
  openGraph: {
    title: 'Eventera Help Center',
    description: 'Guides and answers for organizers and attendees using Eventera.',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/help`,
    siteName: 'Eventera',
    type: 'website',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
