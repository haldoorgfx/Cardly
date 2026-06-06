import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exhibitor Portal — Karta',
};

export default function ExhibitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
