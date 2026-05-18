export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: actorProfile }, { data: users }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', user.id).single(),
    admin.from('profiles').select('id, email, full_name, plan, role, created_at').order('created_at', { ascending: false }),
  ]);

  if (!actorProfile || !['admin', 'super_admin'].includes(actorProfile.role ?? '')) {
    redirect('/dashboard');
  }

  return (
    <AdminUsersClient
      users={users ?? []}
      actorRole={actorProfile.role as 'admin' | 'super_admin'}
      currentUserId={user.id}
    />
  );
}
