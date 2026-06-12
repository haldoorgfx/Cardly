import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Notifications' };
}
export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
