import { getAuthorizedUser } from '@/lib/auth/guards';
import { USER_VIEW } from '@/lib/auth/permissions';
import { listUsers } from '@/lib/admin/queries';
import { toCsv, csvResponse, csvDateStamp } from '@/lib/csv';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/export?q=&role=&plan=&status= — CSV of all users
// matching the current filters (not just the visible page).
export async function GET(request: Request) {
  const result = await getAuthorizedUser(USER_VIEW);
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const { users } = await listUsers({
    search: searchParams.get('q') || undefined,
    role: searchParams.get('role') || undefined,
    plan: searchParams.get('plan') || undefined,
    status: status === 'active' || status === 'suspended' ? status : undefined,
    page: 1,
    pageSize: 10_000,
  });

  const csv = toCsv(users, [
    { header: 'ID',     value: u => u.id },
    { header: 'Name',   value: u => u.full_name ?? '' },
    { header: 'Email',  value: u => u.email },
    { header: 'Role',   value: u => u.role },
    { header: 'Plan',   value: u => u.plan },
    { header: 'Status', value: u => (u.suspended ? 'suspended' : 'active') },
    { header: 'Joined', value: u => u.created_at },
  ]);

  return csvResponse(csv, `eventera-users-${csvDateStamp()}.csv`);
}
