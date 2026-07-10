'use client';

import { PublicNav } from '@/components/events/PublicNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

interface Props {
  slug: string;
  eventName: string;
  features: Record<string, boolean>;
  children: React.ReactNode;
}

export function EventShell({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF6EE' }}>
      <PublicNav />
      <main className="flex-1 min-w-0">{children}</main>
      <MarketingFooter />
    </div>
  );
}
