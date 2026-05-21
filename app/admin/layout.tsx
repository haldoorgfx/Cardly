import { requireAdmin } from '@/lib/auth/guards';
import { AppShell } from '@/components/app/AppShell';

export const metadata = { title: 'Admin — Karta' };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side role guard — middleware is the first layer, this is the second
  await requireAdmin();

  return <AppShell>{children}</AppShell>;
}
