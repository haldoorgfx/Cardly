import { requirePermission, getSessionUser } from '@/lib/auth/guards';
import { USER_VIEW } from '@/lib/auth/permissions';
import { listUsers } from '@/lib/admin/queries';
import { PageShell, PageHeader } from '@/components/dash';
import { UsersAdminClient } from './UsersAdminClient';

export const metadata = { title: 'Accounts — Eventera Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  role?: string;
  plan?: string;
  status?: string;
  sort?: string;
  dir?: string;
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
  const dir  = searchParams.dir === 'asc' ? 'asc' : searchParams.dir === 'desc' ? 'desc' : undefined;

  const { users, total } = await listUsers({
    search: searchParams.q?.trim(),
    role:   searchParams.role,
    plan:   searchParams.plan,
    status: searchParams.status as 'active' | 'suspended' | undefined,
    sort:   searchParams.sort,
    dir,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Users"
        title="Accounts"
        subtitle="Search, filter, manage roles, suspend, and delete accounts."
      />

      <UsersAdminClient
        // Remount when the filters/page change so the client's local `users`
        // state re-initialises from the freshly-filtered server data (otherwise
        // useState keeps the first-mount list while the count updates → the
        // classic "1 user" count over a full, stale table).
        key={`${searchParams.q ?? ''}|${searchParams.role ?? ''}|${searchParams.plan ?? ''}|${searchParams.status ?? ''}|${searchParams.sort ?? ''}|${dir ?? ''}|${page}`}
        users={users as UserRow[]}
        total={total}
        page={page}
        totalPages={totalPages}
        currentUserId={currentUser?.id ?? ''}
        actorRole={currentUser?.role ?? 'admin'}
        sort={searchParams.sort ?? 'joined'}
        dir={dir ?? (searchParams.sort && searchParams.sort !== 'joined' ? 'asc' : 'desc')}
        defaultFilters={{
          q:      searchParams.q      ?? '',
          role:   searchParams.role   ?? '',
          plan:   searchParams.plan   ?? '',
          status: searchParams.status ?? '',
        }}
      />
    </PageShell>
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
