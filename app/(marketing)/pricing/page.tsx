import type { Metadata } from 'next';
import PricingContent from '@/components/marketing/PricingContent';

export const metadata: Metadata = {
  title: 'Pricing — Karta',
  description:
    'Start free with 1 event and 50 registrations. Upgrade to Pro ($19/mo) for unlimited events, or Studio ($49/mo) for the full platform including AI matchmaking, Q&A, and sponsor tools.',
  openGraph: {
    title: 'Karta Pricing',
    description:
      'Start free with 1 event and 50 registrations. Upgrade to Pro ($19/mo) for unlimited events, or Studio ($49/mo) for the full platform including AI matchmaking, Q&A, and sponsor tools.',
    url: 'https://karta.cre8so.com/pricing',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Karta Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karta Pricing',
    description:
      'Start free with 1 event and 50 registrations. Upgrade when you grow.',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
