import { requirePermission, getSessionUser } from '@/lib/auth/guards';
import { USER_VIEW } from '@/lib/auth/permissions';
import { listUsers } from '@/lib/admin/queries';
import { UsersAdminClient } from './UsersAdminClient';

export const metadata = { title: 'Accounts — Eventera Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  role?: string;
  plan?: string;
  status?: string;
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

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));

  const { users, total } = await listUsers({
    search: searchParams.q?.trim(),
    role:   searchParams.role,
    plan:   searchParams.plan,
    status: searchParams.status as 'active' | 'suspended' | undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-10 max-w-[1100px]">
      <div className="mb-8">
        <div className=" text-[12px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Users
        </div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#0F1F18] tracking-tight">
          Accounts
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Search, filter, manage roles, suspend, and delete accounts.
        </p>
      </div>

      <UsersAdminClient
        users={users as UserRow[]}
        total={total}
        page={page}
        totalPages={totalPages}
        currentUserId={currentUser?.id ?? ''}
        actorRole={currentUser?.role ?? 'admin'}
        defaultFilters={{
          q:      searchParams.q      ?? '',
          role:   searchParams.role   ?? '',
          plan:   searchParams.plan   ?? '',
          status: searchParams.status ?? '',
        }}
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
  suspended: boolean;
  suspended_reason: string | null;
}
