import { PricingContent } from '@/components/marketing/PricingContent';

export const metadata = {
  title: 'Pricing',
  description:
    'Start free with up to 50 cards. Upgrade to Pro or Studio when your campaign grows. Cancel anytime, no setup fees.',
  openGraph: {
    title: 'Karta Pricing — Free to start, scales with your campaign',
    description: 'Start free with up to 50 cards. Upgrade to Pro or Studio when your campaign grows. Cancel anytime, no setup fees.',
    url: 'https://karta.cre8so.com/pricing',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Karta Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karta Pricing — Free to start, scales with your campaign',
    description: 'Start free with up to 50 cards. Upgrade to Pro or Studio when your campaign grows.',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
