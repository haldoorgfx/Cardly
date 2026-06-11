import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Brand Kit' };
}
export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
