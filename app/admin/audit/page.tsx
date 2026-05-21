import { requirePermission } from '@/lib/auth/guards';
import { AUDIT_VIEW } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { AuditLogTable, type AuditEntry } from '@/components/admin/AuditLogTable';
import { AuditFiltersClient } from './AuditFiltersClient';

export const metadata = { title: 'Audit Log — Karta Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  action?: string;
  actor?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(AUDIT_VIEW);

  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const adminClient = createAdminClient();

  let query = adminClient
    .from('audit_log')
    .select('id, actor_email, action, entity_type, entity_id, changes, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (searchParams.action) {
    query = query.ilike('action', `${searchParams.action}%`);
  }
  if (searchParams.actor) {
    query = query.ilike('actor_email', `%${searchParams.actor}%`);
  }

  const { data: entries, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-6 lg:p-10 max-w-[1100px]">
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Audit Log
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Audit Log
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Every admin action, in order. Read-only.
        </p>
      </div>

      {/* Filters */}
      <AuditFiltersClient
        defaultAction={searchParams.action ?? ''}
        defaultActor={searchParams.actor ?? ''}
      />

      {/* Count */}
      <div className="mb-4 text-[12px] font-mono text-[#6B7A72]">
        {count ?? 0} {count === 1 ? 'entry' : 'entries'}
        {page > 1 && ` — page ${page} of ${totalPages}`}
      </div>

      {/* Table */}
      <AuditLogTable entries={(entries ?? []) as AuditEntry[]} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <PaginationLink page={page - 1} disabled={page <= 1} label="← Previous" searchParams={searchParams} />
          <span className="text-[13px] text-[#6B7A72] font-mono">
            {page} / {totalPages}
          </span>
          <PaginationLink page={page + 1} disabled={page >= totalPages} label="Next →" searchParams={searchParams} />
        </div>
      )}
    </div>
  );
}

function PaginationLink({
  page, disabled, label, searchParams,
}: {
  page: number;
  disabled: boolean;
  label: string;
  searchParams: SearchParams;
}) {
  const params = new URLSearchParams();
  if (searchParams.action) params.set('action', searchParams.action);
  if (searchParams.actor)  params.set('actor',  searchParams.actor);
  params.set('page', String(page));

  if (disabled) {
    return (
      <span className="text-[13px] text-[#6B7A72]/40 font-mono px-3 py-1.5">{label}</span>
    );
  }
  return (
    <a
      href={`/admin/audit?${params.toString()}`}
      className="text-[13px] font-mono text-[#1F4D3A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E8EFEB] transition-colors"
    >
      {label}
    </a>
  );
}
