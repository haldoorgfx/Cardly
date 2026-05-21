import { requirePermission } from '@/lib/auth/guards';
import { USER_VIEW } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/guards';
import { UsersAdminClient } from './UsersAdminClient';

export const metadata = { title: 'Users — Karta Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(USER_VIEW);

  const currentUser = await getSessionUser();
  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const adminClient = createAdminClient();

  let query = adminClient
    .from('profiles')
    .select('id, email, full_name, role, plan, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (searchParams.q?.trim()) {
    query = query.ilike('email', `%${searchParams.q.trim()}%`);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-10 max-w-[1000px]">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Users
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Users
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Search users and manage roles. Full user management (suspend, delete, filters) is in Phase 2.
        </p>
      </div>

      <UsersAdminClient
        users={(users ?? []) as UserRow[]}
        count={count ?? 0}
        page={page}
        totalPages={totalPages}
        currentUserId={currentUser?.id ?? ''}
        actorRole={currentUser?.role ?? 'admin'}
        defaultQ={searchParams.q ?? ''}
      />
    </div>
  );
}

export interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  plan: string;
  created_at: string;
}
