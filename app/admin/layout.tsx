import { requireAdmin } from '@/lib/auth/guards';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata = { title: 'Admin — Karta' };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard — middleware already blocks non-admins, this is the
  // second layer. If someone bypasses middleware they still get redirected here.
  await requireAdmin();

  return (
    <div className="flex min-h-screen" style={{ background: '#F5F5F4' }}>
      <AdminNav />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
