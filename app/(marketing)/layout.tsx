import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,31,24,0.09) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
