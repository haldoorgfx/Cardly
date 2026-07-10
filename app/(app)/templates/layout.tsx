import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Templates' };
}
export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
