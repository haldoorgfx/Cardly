import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Guides and answers for organizers and attendees using Eventera.',
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
