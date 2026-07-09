import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
