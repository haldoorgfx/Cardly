import { PublicNav } from '@/components/events/PublicNav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <main>{children}</main>
    </div>
  );
}
