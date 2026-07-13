import type { Metadata } from 'next';
import { FaqClient } from '@/components/marketing/FaqClient';

export const metadata: Metadata = {
  title: 'FAQ — Eventera',
  description:
    'Answers about Eventera — events, the Eventera Card, registration and tickets, check-in, the mobile app, pricing, privacy and the API.',
  openGraph: {
    title: 'Eventera FAQ',
    description:
      'Answers about events, the Eventera Card, tickets, check-in, the app, pricing and the API.',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/faq`,
    siteName: 'Eventera',
    type: 'website',
  },
};

export default function FaqPage() {
  return <FaqClient />;
}
